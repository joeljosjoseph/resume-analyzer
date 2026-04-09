import test from "node:test";
import assert from "node:assert/strict";

import { analyzeResume } from "../lib/analyzer.mjs";
import { detectResumeFormat } from "../lib/resume-parsers.mjs";

test("analyzeResume refuses to run when the confirmed resume text is empty", () => {
  const result = analyzeResume({
    resumeText: "   ",
    jobDescription: "Security analyst role with incident response and SIEM responsibilities.",
  });

  assert.deepEqual(result, {
    refusal: {
      title: "Analysis could not run",
      message: "The confirmed resume text is empty. Paste the extracted text or upload a clearer file first.",
    },
  });
});

test("analyzeResume refuses to run when the job description is empty", () => {
  const result = analyzeResume({
    resumeText: "Experience\nHandled alerts and investigations across security tooling.",
    jobDescription: "   ",
  });

  assert.deepEqual(result, {
    refusal: {
      title: "Analysis could not run",
      message: "A target job description is required for grounded feedback.",
    },
  });
});

test("analyzeResume refuses to run when the job description is too incomplete to interpret", () => {
  const result = analyzeResume({
    resumeText: "Experience\nHandled alerts and investigations across security tooling.",
    jobDescription: "Security analyst role",
  });

  assert.deepEqual(result, {
    refusal: {
      title: "Analysis could not run",
      message:
        "The job description does not contain enough usable detail yet. Paste a fuller posting with responsibilities and qualifications.",
    },
  });
});

test("analyzeResume returns a low-confidence band instead of a numeric score when evidence is sparse", () => {
  const result = analyzeResume({
    resumeText: `Summary
Entry-level analyst with internship experience.

Experience
Reviewed alerts and documented findings.`,
    jobDescription: `Responsibilities
Review security alerts and support incident response.

Qualifications
Experience with SIEM platforms and ticketing systems.`,
  });

  assert.equal(result.refusal, undefined);
  assert.equal(result.score, null);
  assert.equal(typeof result.scoreBand, "string");
  assert.ok(result.scoreBand.length > 0);
  assert.equal(result.confidence.level, "low");
  assert.match(result.scoreExplanation, /directional assessment/i);
  assert.ok(
    result.confidence.reasons.some((reason) => /job description is short/i.test(reason)),
    "expected low-confidence reasons to mention limited job-description detail",
  );
});

test("analyzeResume returns grounded strengths, gaps, and missing sections for a fuller comparison", () => {
  const result = analyzeResume({
    resumeText: `Summary
Security analyst with several years of experience supporting investigations, improving detection workflows, partnering with operations teams, and documenting remediation steps across a busy security program.

Skills
SIEM, incident response, Python, ticketing systems, phishing analysis, stakeholder communication

Experience
Investigated phishing alerts, triaged incidents, tuned SIEM detections, automated repetitive triage steps with Python, and documented remediation actions for internal stakeholders.
Built reporting notes for recurring incidents, partnered with teammates on alert quality improvements, and tracked follow-up actions through ticketing systems.

Education
Bachelor of Science in Information Technology`,
    jobDescription: `Responsibilities
Lead incident response investigations across phishing, malware, and endpoint alerts.
Build and improve SIEM detections and automate repetitive triage tasks with Python.
Communicate findings clearly with stakeholders and document remediation actions.
Support security operations metrics reviews and explain trends during recurring team check-ins.

Qualifications
Experience with SIEM platforms, incident response workflows, and security operations metrics.
Bachelor's degree in information technology, computer science, or a related field.
Security certification such as Security+ is preferred.
Comfort working across alerts, tickets, documentation, and follow-up coordination in a collaborative environment.`,
  });

  assert.equal(result.refusal, undefined);
  assert.equal(result.confidence.level, "high");
  assert.equal(typeof result.score, "number");
  assert.ok(result.score >= 0);
  assert.ok(result.strengths.length > 0, "expected at least one demonstrated strength");
  assert.ok(result.gaps.length > 0, "expected at least one grounded gap");
  assert.ok(
    result.strengths.some((item) => /SIEM|incident response|degree/i.test(item.jobRequirement)),
    "expected strengths to reference matched job requirements",
  );
  assert.ok(
    result.gaps.some((item) => item.label === "missing" || item.label === "weakly demonstrated"),
    "expected at least one non-demonstrated requirement",
  );
  assert.ok(
    result.rewriteSuggestions.every((item) => item.targetSection && item.jobRequirement && item.reason),
    "expected rewrite suggestions to stay grounded in a section and requirement",
  );
  assert.deepEqual(result.missingSections, []);
});

test("detectResumeFormat recognizes supported files and rejects unsupported ones", () => {
  assert.equal(detectResumeFormat({ name: "resume.pdf" }), "pdf");
  assert.equal(detectResumeFormat({ name: "resume.DOCX" }), "docx");
  assert.equal(detectResumeFormat({ name: "resume.txt" }), null);
});
