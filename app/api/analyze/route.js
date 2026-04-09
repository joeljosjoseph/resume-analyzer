import { NextResponse } from "next/server";
import { analyzeResumeWithLlm } from "@/lib/llm-resume-analysis.mjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const resumeText = body.resumeText?.trim() ?? "";
    const jobDescription = body.jobDescription?.trim() ?? "";

    if (!resumeText) {
      return NextResponse.json(
        { error: "The confirmed resume text is empty. Extract or paste the resume before analyzing." },
        { status: 400 },
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: "A job description is required before running analysis." },
        { status: 400 },
      );
    }

    const analysis = await analyzeResumeWithLlm({
      resumeText,
      jobDescription,
      targetRole: body.targetRole ?? "",
      seniority: body.seniority ?? "",
      parsingIssues: Array.isArray(body.parsingIssues) ? body.parsingIssues : [],
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The LLM analysis could not be completed right now.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
