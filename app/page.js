"use client";

import { useEffect, useState } from "react";
import { parseResumeFile } from "@/lib/resume-parsers.mjs";
import InfoTile from "./components/InfoTile";
import Results from "./components/Results";
import StatusBadge from "./components/StatusBadge";

const EMPTY_SURVEY = {
  answer: "",
  note: "",
};
const STORAGE_KEY = "grounded-resume-analyzer-session";

function createSessionSnapshot({
  resumeFile,
  jobDescription,
  targetRole,
  seniority,
  extractedText,
  parseIssues,
  parseFormat,
  status,
  analysis,
  survey,
}) {
  return {
    savedAt: new Date().toISOString(),
    resumeFileName: resumeFile?.name ?? "",
    jobDescription,
    targetRole,
    seniority,
    extractedText,
    parseIssues,
    parseFormat,
    status,
    analysis,
    survey,
  };
}

function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function normalizeLegacyList(items, fields) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (!item || typeof item !== "object") {
        return "";
      }

      return fields
        .map((field) => item[field])
        .filter((value) => typeof value === "string" && value.trim())
        .join(" ")
        .trim();
    })
    .filter(Boolean);
}

function normalizeSavedAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object") {
    return analysis;
  }

  if ("fitAssessment" in analysis || "improvements" in analysis || "caveats" in analysis) {
    return {
      ...analysis,
      strengths: normalizeLegacyList(analysis.strengths, ["jobRequirement", "explanation"]),
      weaknesses: normalizeLegacyList(analysis.weaknesses, ["jobRequirement", "explanation"]),
      improvements: normalizeLegacyList(analysis.improvements, ["reason", "revisedExample", "jobRequirement"]),
      caveats: normalizeLegacyList(analysis.caveats, ["section", "importance"]),
    };
  }

  return {
    summary: analysis.scoreExplanation || "Previously saved analysis loaded from an older app version.",
    fitAssessment:
      analysis.score !== null && analysis.score !== undefined
        ? `Legacy match score: ${analysis.score}. ${analysis.scoreBand || ""}`.trim()
        : analysis.scoreBand || "Legacy analysis loaded from a previous version.",
    strengths: normalizeLegacyList(analysis.strengths, ["jobRequirement", "explanation"]),
    weaknesses: normalizeLegacyList(analysis.gaps, ["jobRequirement", "explanation", "label"]),
    improvements: normalizeLegacyList(analysis.rewriteSuggestions, ["reason", "revisedExample", "jobRequirement"]),
    caveats: normalizeLegacyList(analysis.missingSections, ["section", "importance"]).concat(
      normalizeLegacyList(analysis.parsingIssues, []),
    ),
    model: "legacy-saved-analysis",
  };
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [parseIssues, setParseIssues] = useState([]);
  const [parseFormat, setParseFormat] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [survey, setSurvey] = useState(EMPTY_SURVEY);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  useEffect(() => {
    const savedSession = window.localStorage.getItem(STORAGE_KEY);

    if (!savedSession) {
      setHasLoadedDraft(true);
      return;
    }

    try {
      const parsed = JSON.parse(savedSession);

      setJobDescription(parsed.jobDescription ?? "");
      setTargetRole(parsed.targetRole ?? "");
      setSeniority(parsed.seniority ?? "");
      setExtractedText(parsed.extractedText ?? "");
      setParseIssues(Array.isArray(parsed.parseIssues) ? parsed.parseIssues : []);
      setParseFormat(parsed.parseFormat ?? "");
      setAnalysis(normalizeSavedAnalysis(parsed.analysis ?? null));
      setSurvey(parsed.survey ?? EMPTY_SURVEY);
      setStatus(parsed.status ?? "idle");
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasLoadedDraft(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedDraft) {
      return;
    }

    const snapshot = createSessionSnapshot({
      resumeFile,
      jobDescription,
      targetRole,
      seniority,
      extractedText,
      parseIssues,
      parseFormat,
      status,
      analysis,
      survey,
    });

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    resumeFile,
    jobDescription,
    targetRole,
    seniority,
    extractedText,
    parseIssues,
    parseFormat,
    status,
    analysis,
    survey,
    hasLoadedDraft,
  ]);

  async function handleExtract(event) {
    event.preventDefault();
    setErrorMessage("");
    setAnalysis(null);

    if (!resumeFile) {
      setErrorMessage("Upload a PDF or DOCX resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setErrorMessage("Paste the job description before extracting the resume.");
      return;
    }

    setStatus("extracting");

    try {
      const parsed = await parseResumeFile(resumeFile);

      if (!parsed.text) {
        throw new Error("The resume could not be read. Try a clearer file or paste plain text after extraction.");
      }

      setExtractedText(parsed.text);
      setParseIssues(parsed.issues);
      setParseFormat(parsed.format.toUpperCase());
      setStatus("ready");
    } catch (error) {
      setStatus("idle");
      setErrorMessage(error.message || "The resume could not be parsed.");
    }
  }

  async function handleAnalyze() {
    setErrorMessage("");
    setStatus("analyzing");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: extractedText,
          jobDescription,
          targetRole,
          seniority,
          parsingIssues: parseIssues,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The LLM analysis could not be completed.");
      }

      setAnalysis(payload.analysis);
      setStatus("done");
      setSurvey(EMPTY_SURVEY);
    } catch (error) {
      setStatus("ready");
      setAnalysis(null);
      setErrorMessage(error.message || "The LLM analysis could not be completed.");
    }
  }

  function handleDownloadSession() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const snapshot = createSessionSnapshot({
      resumeFile,
      jobDescription,
      targetRole,
      seniority,
      extractedText,
      parseIssues,
      parseFormat,
      status,
      analysis,
      survey,
    });

    downloadJsonFile(`resume-analysis-${timestamp}.json`, snapshot);
  }

  function handleClearSavedData() {
    window.localStorage.removeItem(STORAGE_KEY);
    setResumeFile(null);
    setJobDescription("");
    setTargetRole("");
    setSeniority("");
    setExtractedText("");
    setParseIssues([]);
    setParseFormat("");
    setStatus("idle");
    setErrorMessage("");
    setAnalysis(null);
    setSurvey(EMPTY_SURVEY);
  }

  const hasSessionData =
    Boolean(jobDescription.trim()) ||
    Boolean(targetRole.trim()) ||
    Boolean(seniority.trim()) ||
    Boolean(extractedText.trim()) ||
    Boolean(analysis);

  return (
    <main className="min-h-screen px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6 rounded-[2rem] border border-white/60 bg-white/75 p-4 shadow-[0_30px_80px_rgba(13,23,38,0.12)] backdrop-blur md:p-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <p
              className="text-xs uppercase tracking-[0.32em] text-[var(--teal)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Grounded Resume Analyzer
            </p>
            <div className="space-y-3">
              <h1
                className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-display)" }} role="heading"
              >
                Upload your resume, paste the role, and get honest feedback you can actually use.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                This version sends the confirmed resume text and job description to an LLM on the server, then returns
                a structured review with strengths, weaknesses, and concrete improvements.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile title="Input" body="PDF or DOCX plus a pasted job description." />
              <InfoTile title="Guardrail" body="The prompt tells the model not to invent experience, metrics, or skills." />
              <InfoTile title="Output" body="Summary, fit assessment, strengths, weaknesses, and improvements." />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleDownloadSession}
                disabled={!hasSessionData}
              >
                Download Session File
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-transparent px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleClearSavedData}
                disabled={!hasSessionData}
              >
                Clear Saved Draft
              </button>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              Your draft now auto-saves in this browser, and you can export the current session as a JSON file anytime.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-900/10 bg-slate-950 px-5 py-5 text-white shadow-[0_18px_50px_rgba(13,23,38,0.28)]">
            <p
              className="text-xs uppercase tracking-[0.24em] text-[var(--sand)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Promise
            </p>
            <h2
              className="mt-3 text-2xl font-medium leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Server-side LLM review without exposing your API key in the browser.
            </h2>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Resume text stays editable before analysis, so you can correct bad extraction first.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                The OpenAI request runs from a Next.js route handler, not from the client.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                The model is instructed to stay grounded in the provided resume and job description.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.02fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.22em] text-slate-400"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Intake
                </p>
                <h2
                  className="mt-2 text-2xl font-medium text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Load the resume and target role
                </h2>
              </div>
              <StatusBadge status={status} />
            </div>

            <form className="space-y-4" onSubmit={handleExtract}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Resume file</span>
                <input
                  className="block w-full rounded-[1.15rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--coral)] file:px-4 file:py-2 file:font-medium file:text-slate-950 hover:file:bg-[#f7a385]"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Target role</span>
                  <input
                    className="w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 placeholder:text-slate-400 focus:border-[var(--teal)]"
                    type="text"
                    value={targetRole}
                    onChange={(event) => setTargetRole(event.target.value)}
                    placeholder="Security analyst"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Seniority</span>
                  <select
                    className="w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 focus:border-[var(--teal)]"
                    value={seniority}
                    onChange={(event) => setSeniority(event.target.value)}
                  >
                    <option value="">Not specified</option>
                    <option value="Entry level">Entry level</option>
                    <option value="Mid level">Mid level</option>
                    <option value="Senior">Senior</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Job description</span>
                <textarea
                  className="min-h-56 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 leading-7 outline-none ring-0 placeholder:text-slate-400 focus:border-[var(--teal)]"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the responsibilities and qualifications here."
                />
              </label>

              {errorMessage ? (
                <div className="rounded-[1.15rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  type="submit"
                  disabled={status === "extracting"}
                >
                  {status === "extracting" ? "Extracting..." : "Extract Resume Text"}
                </button>
                <p className="self-center text-sm text-slate-500">
                  The LLM does not run until the extracted text is visible and editable below.
                </p>
              </div>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-[#f8f5ee] p-5 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.22em] text-slate-400"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Confirmation
                </p>
                <h2
                  className="mt-2 text-2xl font-medium text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Review the extracted resume text
                </h2>
              </div>
              {parseFormat ? (
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
                  {parseFormat}
                </span>
              ) : null}
            </div>

            <textarea
              className="min-h-[24rem] w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-[var(--teal)]"
              value={extractedText}
              onChange={(event) => setExtractedText(event.target.value)}
              placeholder="After extraction, the resume text will appear here. You can correct section headings or paste plain text if parsing missed something."
            />

            <div className="mt-4 grid gap-3">
              {parseIssues.length > 0 ? (
                <div className="rounded-[1.15rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-medium text-amber-900">Parsing warnings</p>
                  <ul className="mt-2 space-y-1">
                    {parseIssues.map((issue) => (
                      <li key={issue}>- {issue}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  The extracted text is ready for confirmation. Edit anything that looks incomplete before sending it to the model.
                </div>
              )}

              <button
                className="inline-flex items-center justify-center rounded-full bg-[var(--coral)] px-5 py-3 font-medium text-slate-950 transition hover:bg-[#f7a385] focus:outline-none focus:ring-2 focus:ring-[var(--sand)] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleAnalyze}
                disabled={!extractedText.trim() || !jobDescription.trim() || status === "analyzing"}
              >
                {status === "analyzing" ? "Analyzing..." : "Run LLM Analysis"}
              </button>
            </div>
          </div>
        </section>

        <Results analysis={analysis} survey={survey} setSurvey={setSurvey} />
      </div>
    </main>
  );
}





