import { GoogleGenerativeAI } from "@google/generative-ai";

const ANALYSIS_PROMPT = `You are an expert resume reviewer.

Analyze the resume only against the provided job description and user-provided context.
Do not invent experience, certifications, tools, or achievements that are not present.
Be direct, specific, and recruiter-friendly.
Return valid JSON only with this exact shape:
{
  "summary": "short paragraph",
  "fitAssessment": "short paragraph",
  "strengths": ["bullet", "bullet"],
  "weaknesses": ["bullet", "bullet"],
  "improvements": ["bullet", "bullet"],
  "caveats": ["bullet", "bullet"]
}`;

function extractJsonObject(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("The model did not return valid JSON.");
}

function ensureStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => `${item}`.trim()).filter(Boolean);
}

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing on the server.");
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const MODEL_NAME = "gemini-2.5-flash-lite";

export async function analyzeResumeWithLlm({
  resumeText,
  jobDescription,
  targetRole = "",
  seniority = "",
  parsingIssues = [],
}) {
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: ANALYSIS_PROMPT,
    generationConfig: {
      temperature: 0.3,
      // Ask Gemini to return JSON directly — avoids fenced-code-block wrapping.
      responseMimeType: "application/json",
    },
  });

  const userMessage = `Target role: ${targetRole || "Not specified"}
Seniority: ${seniority || "Not specified"}
Parsing issues: ${parsingIssues.length > 0 ? parsingIssues.join("; ") : "None"}

Job description:
${jobDescription}

Resume text:
${resumeText}`;

  const result = await model.generateContent(userMessage);
  const content = result.response.text();

  if (!content) {
    throw new Error("The model returned an empty response.");
  }

  const parsed = JSON.parse(extractJsonObject(content));

  return {
    summary: `${parsed.summary ?? ""}`.trim(),
    fitAssessment: `${parsed.fitAssessment ?? ""}`.trim(),
    strengths: ensureStringArray(parsed.strengths),
    weaknesses: ensureStringArray(parsed.weaknesses),
    improvements: ensureStringArray(parsed.improvements),
    caveats: ensureStringArray(parsed.caveats),
    model: MODEL_NAME,
  };
}
