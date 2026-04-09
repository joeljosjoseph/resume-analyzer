const STOP_WORDS = new Set([
  "a",
  "about",
  "across",
  "after",
  "all",
  "also",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "by",
  "can",
  "demonstrated",
  "develop",
  "experience",
  "for",
  "from",
  "have",
  "help",
  "in",
  "into",
  "is",
  "it",
  "its",
  "job",
  "knowledge",
  "more",
  "must",
  "of",
  "on",
  "or",
  "our",
  "role",
  "should",
  "skills",
  "strong",
  "team",
  "that",
  "the",
  "their",
  "them",
  "this",
  "to",
  "using",
  "we",
  "will",
  "with",
  "work",
  "years",
  "you",
  "your",
]);

const SECTION_ALIASES = new Map([
  ["summary", "Summary"],
  ["profile", "Summary"],
  ["professional summary", "Summary"],
  ["objective", "Summary"],
  ["skills", "Skills"],
  ["technical skills", "Skills"],
  ["core skills", "Skills"],
  ["competencies", "Skills"],
  ["experience", "Experience"],
  ["professional experience", "Experience"],
  ["work experience", "Experience"],
  ["employment", "Experience"],
  ["projects", "Projects"],
  ["education", "Education"],
  ["certifications", "Certifications"],
  ["certificates", "Certifications"],
  ["awards", "Awards"],
]);

const REQUIREMENT_GROUPS = [
  {
    category: "Skills",
    patterns: ["skill", "tool", "technology", "platform", "language", "framework", "stack", "software"],
  },
  {
    category: "Experience",
    patterns: ["experience", "lead", "manage", "build", "deliver", "implement", "support", "coordinate", "analyze"],
  },
  {
    category: "Education",
    patterns: ["degree", "diploma", "bachelor", "master", "education", "college", "university"],
  },
  {
    category: "Certifications",
    patterns: ["certification", "certificate", "licensed", "license"],
  },
];

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractSections(resumeText) {
  const rawLines = splitLines(resumeText);
  const sections = new Map();
  let currentSection = "General";

  for (const line of rawLines) {
    const alias = SECTION_ALIASES.get(normalizeText(line));

    if (alias) {
      currentSection = alias;

      if (!sections.has(currentSection)) {
        sections.set(currentSection, []);
      }

      continue;
    }

    if (!sections.has(currentSection)) {
      sections.set(currentSection, []);
    }

    sections.get(currentSection).push(line);
  }

  return Object.fromEntries(
    [...sections.entries()].map(([sectionName, lines]) => [
      sectionName,
      {
        lines,
        text: lines.join("\n"),
        normalized: normalizeText(lines.join(" ")),
      },
    ]),
  );
}

function splitJobDescriptionIntoRequirements(jobDescription) {
  const lines = splitLines(jobDescription)
    .map((line) => line.replace(/^[•*\-]\s*/, "").trim())
    .filter((line) => line.length >= 12);

  const requirements = [];

  for (const line of lines) {
    const segments = line
      .split(/(?<=[.;])\s+|(?<=:)\s+/)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length >= 12);

    for (const segment of segments) {
      requirements.push(segment.replace(/[.;]$/, ""));
    }
  }

  return requirements.slice(0, 18);
}

function extractSignals(requirementText) {
  const normalized = normalizeText(requirementText);
  const words = normalized
    .split(" ")
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

  const singleWords = [...new Set(words)];
  const pairs = [];

  for (let index = 0; index < words.length - 1; index += 1) {
    const left = words[index];
    const right = words[index + 1];

    if (STOP_WORDS.has(left) || STOP_WORDS.has(right)) {
      continue;
    }

    pairs.push(`${left} ${right}`);
  }

  return [...new Set([...pairs, ...singleWords])]
    .filter((signal) => signal.length >= 4)
    .slice(0, 8);
}

function inferCategory(requirementText) {
  const normalized = normalizeText(requirementText);

  for (const group of REQUIREMENT_GROUPS) {
    if (group.patterns.some((pattern) => normalized.includes(pattern))) {
      return group.category;
    }
  }

  return "Experience";
}

function scorePriority(requirementText) {
  const normalized = normalizeText(requirementText);
  let score = 1;

  if (/\bmust\b|\brequired\b|\bneed\b|\bminimum\b/.test(normalized)) {
    score += 3;
  }

  if (/\bpreferred\b|\bbonus\b|\bnice to have\b/.test(normalized)) {
    score -= 1;
  }

  if (/\bexperience\b|\bdeliver\b|\bown\b|\blead\b|\bmanage\b/.test(normalized)) {
    score += 1;
  }

  return Math.max(score, 1);
}

function pickBestSection(sections, requirement) {
  if (sections[requirement.category]) {
    return requirement.category;
  }

  if (sections.Experience) {
    return "Experience";
  }

  if (sections.Skills) {
    return "Skills";
  }

  return Object.keys(sections)[0] ?? "General";
}

function evaluateRequirement(requirement, sections, normalizedResume) {
  const signals = requirement.signals;
  const matchedSignals = signals.filter((signal) => normalizedResume.includes(signal));
  const targetSection = pickBestSection(sections, requirement);
  const sectionText = sections[targetSection]?.normalized ?? "";
  const sectionMatches = signals.filter((signal) => sectionText.includes(signal));

  let label = "missing";
  let score = 0.12;

  if (matchedSignals.length >= Math.max(2, Math.ceil(signals.length / 2))) {
    label = "demonstrated";
    score = 1;
  } else if (matchedSignals.length > 0 && sectionMatches.length > 0) {
    label = "weakly demonstrated";
    score = 0.6;
  } else if (matchedSignals.length > 0) {
    label = "not clearly shown";
    score = 0.38;
  }

  return {
    ...requirement,
    label,
    score,
    targetSection,
    matchedSignals,
  };
}

function pickEvidenceLine(section, requirement) {
  if (!section) {
    return "";
  }

  return (
    section.lines.find((line) =>
      requirement.signals.some((signal) => normalizeText(line).includes(signal)),
    ) ??
    section.lines[0] ??
    ""
  );
}

function buildRewriteSuggestion(gap, sections) {
  const sectionName = gap.targetSection;
  const section = sections[sectionName];
  const evidenceLine = pickEvidenceLine(section, gap);
  const focusSignal =
    gap.matchedSignals[0] ??
    gap.signals[0] ??
    gap.text.split(" ").slice(0, 3).join(" ");

  let revisedExample =
    "Reshape an existing bullet so the requirement is explicit, concrete, and easy for a recruiter to spot.";

  if (evidenceLine) {
    revisedExample = `Start from existing wording like "${evidenceLine}" and revise it so "${focusSignal}" is named directly and tied to the responsibility in the job description.`;
  } else if (sectionName === "Skills") {
    revisedExample = `If you already use ${focusSignal}, surface it explicitly in a grouped Skills section. If you do not, leave it out rather than guessing.`;
  } else if (sectionName === "Summary") {
    revisedExample = `Use the summary to foreground your existing background and connect it honestly to "${gap.text}" without adding new claims.`;
  }

  return {
    targetSection: sectionName,
    reason: `The role asks for "${gap.text}" but your resume does not show that strongly enough yet.`,
    jobRequirement: gap.text,
    revisedExample,
  };
}

function detectMissingSections(sections) {
  const expected = ["Summary", "Skills", "Experience", "Education"];

  return expected
    .filter((sectionName) => !sections[sectionName])
    .map((sectionName) => ({
      section: sectionName,
      importance:
        sectionName === "Experience" || sectionName === "Education"
          ? "important"
          : "optional depending on the role",
    }));
}

function scoreConfidence({ resumeText, jobDescription, requirements, parsingIssues }) {
  const reasons = [];
  let level = "high";

  if (resumeText.length < 350) {
    level = "low";
    reasons.push("Very little resume text was available after extraction.");
  }

  if (jobDescription.length < 250) {
    level = "low";
    reasons.push("The job description is short, so requirement coverage may be incomplete.");
  }

  if (requirements.length < 4) {
    level = "low";
    reasons.push("Only a small number of job requirements could be inferred.");
  }

  if (parsingIssues.length > 0 && level !== "low") {
    level = "medium";
    reasons.push("Resume extraction surfaced formatting warnings.");
  }

  return {
    level,
    reasons,
  };
}

function buildScoreBand(score) {
  if (score >= 74) {
    return "strong alignment";
  }

  if (score >= 48) {
    return "partial alignment";
  }

  return "insufficient evidence";
}

export function analyzeResume({
  resumeText,
  jobDescription,
  targetRole = "",
  seniority = "",
  parsingIssues = [],
}) {
  const trimmedResume = resumeText.trim();
  const trimmedJob = jobDescription.trim();

  if (!trimmedResume) {
    return {
      refusal: {
        title: "Analysis could not run",
        message: "The confirmed resume text is empty. Paste the extracted text or upload a clearer file first.",
      },
    };
  }

  if (!trimmedJob) {
    return {
      refusal: {
        title: "Analysis could not run",
        message: "A target job description is required for grounded feedback.",
      },
    };
  }

  const sections = extractSections(trimmedResume);
  const normalizedResume = normalizeText(trimmedResume);
  const requirements = splitJobDescriptionIntoRequirements(trimmedJob).map((text) => ({
    text,
    category: inferCategory(text),
    priority: scorePriority(text),
    signals: extractSignals(text),
  }));

  const confidence = scoreConfidence({
    resumeText: trimmedResume,
    jobDescription: trimmedJob,
    requirements,
    parsingIssues,
  });

  if (requirements.length === 0) {
    return {
      refusal: {
        title: "Analysis could not run",
        message:
          "The job description does not contain enough usable detail yet. Paste a fuller posting with responsibilities and qualifications.",
      },
    };
  }

  const evaluated = requirements
    .map((requirement) => evaluateRequirement(requirement, sections, normalizedResume))
    .sort((left, right) => right.priority - left.priority);

  const totalPossible = evaluated.reduce((sum, item) => sum + item.priority, 0);
  const earned = evaluated.reduce((sum, item) => sum + item.priority * item.score, 0);
  const rawScore = Math.round((earned / totalPossible) * 100);
  const lowConfidence = confidence.level === "low";

  const gaps = evaluated
    .filter((item) => item.label !== "demonstrated")
    .slice(0, 5)
    .map((item) => ({
      jobRequirement: item.text,
      section: item.targetSection,
      label: item.label,
      explanation:
        item.label === "missing"
          ? "The resume does not show clear evidence for this requirement in the confirmed text."
          : "There is some related evidence, but it is not explicit enough for this role yet.",
    }));

  const strengths = evaluated
    .filter((item) => item.label === "demonstrated")
    .slice(0, 3)
    .map((item) => ({
      jobRequirement: item.text,
      explanation: "Your resume already shows relevant evidence for this requirement.",
    }));

  const rewriteSuggestions = evaluated
    .filter((item) => item.label !== "missing")
    .slice(0, 3)
    .map((item) => buildRewriteSuggestion(item, sections));

  return {
    score: lowConfidence ? null : rawScore,
    scoreBand: buildScoreBand(rawScore),
    confidence,
    scoreExplanation:
      "This is a directional assessment of resume-to-role alignment based on the provided job description and confirmed resume text. It is guidance, not a prediction of hiring outcomes.",
    targetRole,
    seniority,
    gaps,
    strengths,
    rewriteSuggestions,
    missingSections: detectMissingSections(sections),
    parsingIssues,
  };
}
