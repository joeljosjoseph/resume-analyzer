"use client";

import { useState } from "react";
import { analyzeResume } from "@/lib/analyzer.mjs";
import { parseResumeFile } from "@/lib/resume-parsers.mjs";

const EMPTY_SURVEY = {
  answer: "",
  note: "",
};

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

  function handleAnalyze() {
    setErrorMessage("");

    const nextAnalysis = analyzeResume({
      resumeText: extractedText,
      jobDescription,
      targetRole,
      seniority,
      parsingIssues: parseIssues,
    });

    setAnalysis(nextAnalysis);
    setStatus(nextAnalysis.refusal ? "ready" : "done");
    setSurvey(EMPTY_SURVEY);
  }

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
                style={{ fontFamily: "var(--font-display)" }}
              >
                Upload your resume, paste the role, and get honest feedback you can actually use.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                This first version stays grounded on the confirmed resume text and the actual job description. It
                highlights likely gaps, what already reads well, and where stronger wording would help.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile title="Input" body="PDF or DOCX plus a pasted job description." />
              <InfoTile title="Guardrail" body="No fabricated experience, metrics, or skills." />
              <InfoTile title="Output" body="Match score or low-confidence fallback, gaps, and rewrites." />
            </div>
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
              Structured, evidence-based review instead of generic chatbot advice.
            </h2>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Each gap is tied to a job requirement and the resume section that was reviewed.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                If extraction or input quality is weak, the app drops confidence instead of bluffing.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Suggestions only tell the user how to clarify what is already there.
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
                  The analyzer does not run until the extracted text is visible and editable below.
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
                  The extracted text is ready for confirmation. Edit anything that looks incomplete before analyzing.
                </div>
              )}

              <button
                className="inline-flex items-center justify-center rounded-full bg-[var(--coral)] px-5 py-3 font-medium text-slate-950 transition hover:bg-[#f7a385] focus:outline-none focus:ring-2 focus:ring-[var(--sand)] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleAnalyze}
                disabled={!extractedText.trim() || !jobDescription.trim()}
              >
                Run Grounded Analysis
              </button>
            </div>
          </div>
        </section>

        <Results analysis={analysis} survey={survey} setSurvey={setSurvey} />
      </div>
    </main>
  );
}

function Results({ analysis, survey, setSurvey }) {
  if (!analysis) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-slate-500">
        Extract the resume text, confirm it, and the grounded analysis will appear here.
      </section>
    );
  }

  if (analysis.refusal) {
    return (
      <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-6 py-6 text-rose-800">
        <p
          className="text-xs uppercase tracking-[0.22em] text-rose-500"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Refusal
        </p>
        <h2
          className="mt-2 text-2xl font-medium text-rose-950"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {analysis.refusal.title}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7">{analysis.refusal.message}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(13,23,38,0.28)]">
          <p
            className="text-xs uppercase tracking-[0.24em] text-[var(--sand)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Alignment
          </p>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <p
                className="text-5xl font-semibold tracking-[-0.05em]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {analysis.score ?? analysis.scoreBand}
              </p>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-slate-300">
                {analysis.score === null ? "confidence fallback" : "match score"}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-300">{analysis.scoreExplanation}</p>

          <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Confidence: {analysis.confidence.level}</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              {analysis.confidence.reasons.length > 0 ? (
                analysis.confidence.reasons.map((reason) => <li key={reason}>- {reason}</li>)
              ) : (
                <li>- Inputs look detailed enough for a directional read.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
          <p
            className="text-xs uppercase tracking-[0.22em] text-slate-400"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            What To Fix
          </p>
          <h2
            className="mt-2 text-3xl font-medium text-slate-950"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Top 5 gaps
          </h2>
          <div className="mt-5 space-y-3">
            {analysis.gaps.map((gap) => (
              <article
                key={`${gap.jobRequirement}-${gap.section}`}
                className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white">
                    {gap.label}
                  </span>
                  <span className="text-sm text-slate-500">Section reviewed: {gap.section}</span>
                </div>
                <p className="mt-3 text-base font-medium leading-7 text-slate-900">{gap.jobRequirement}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{gap.explanation}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
          <p
            className="text-xs uppercase tracking-[0.22em] text-slate-400"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Rewrite Cues
          </p>
          <h2
            className="mt-2 text-3xl font-medium text-slate-950"
            style={{ fontFamily: "var(--font-display)" }}
          >
            3 grounded rewrite suggestions
          </h2>
          <div className="mt-5 space-y-3">
            {analysis.rewriteSuggestions.length > 0 ? (
              analysis.rewriteSuggestions.map((suggestion) => (
                <article
                  key={`${suggestion.targetSection}-${suggestion.jobRequirement}`}
                  className="rounded-[1.3rem] border border-[var(--sand)]/70 bg-[#fff8ed] px-4 py-4"
                >
                  <p className="text-sm uppercase tracking-[0.16em] text-slate-500">{suggestion.targetSection}</p>
                  <p className="mt-2 text-base font-medium leading-7 text-slate-900">{suggestion.reason}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Maps to: <span className="font-medium text-slate-800">{suggestion.jobRequirement}</span>
                  </p>
                  <p className="mt-3 rounded-[1rem] bg-white px-3 py-3 text-sm leading-6 text-slate-700">
                    {suggestion.revisedExample}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                The resume has very few partially matched gaps to rewrite. That usually means the biggest issues are
                truly missing evidence, not wording.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
            <p
              className="text-xs uppercase tracking-[0.22em] text-slate-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Already Working
            </p>
            <h2
              className="mt-2 text-3xl font-medium text-slate-950"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Stronger signals
            </h2>
            <div className="mt-5 space-y-3">
              {analysis.strengths.length > 0 ? (
                analysis.strengths.map((strength) => (
                  <article
                    key={strength.jobRequirement}
                    className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-4 py-4"
                  >
                    <p className="text-base font-medium leading-7 text-emerald-950">{strength.jobRequirement}</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-800">{strength.explanation}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                  No strong matches were found yet. That usually means the resume needs sharper alignment or the role is
                  materially different from the candidate background.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
            <p
              className="text-xs uppercase tracking-[0.22em] text-slate-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Missing Sections
            </p>
            <div className="mt-4 space-y-3">
              {analysis.missingSections.length > 0 ? (
                analysis.missingSections.map((item) => (
                  <div
                    key={item.section}
                    className="rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="font-medium text-slate-900">{item.section}</span>: {item.importance}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                  The resume includes the standard core sections this analyzer expects.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-900">
                Was this feedback specific enough that you would change your resume before applying?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Yes", "Somewhat", "No"].map((option) => (
                  <button
                    key={option}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      survey.answer === option
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                    type="button"
                    onClick={() => setSurvey((current) => ({ ...current, answer: option }))}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <textarea
                className="mt-3 min-h-24 w-full rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-[var(--teal)]"
                value={survey.note}
                onChange={(event) => setSurvey((current) => ({ ...current, note: event.target.value }))}
                placeholder="Optional note on what felt useful or too generic."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoTile({ title, body }) {
  return (
    <div className="rounded-[1.3rem] border border-white/60 bg-white/70 px-4 py-4 shadow-[0_10px_25px_rgba(13,23,38,0.06)]">
      <p
        className="text-xs uppercase tracking-[0.22em] text-slate-400"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const copy = {
    idle: "Waiting",
    extracting: "Parsing",
    ready: "Ready",
    done: "Analyzed",
  };

  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
      {copy[status] ?? "Waiting"}
    </span>
  );
}
