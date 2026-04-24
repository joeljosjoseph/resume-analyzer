import { analyzeResume } from "./lib/analyzer.mjs";

// Test cases for evaluation
const testCases = [
    {
        name: "Entry-level security analyst",
        resumeText: `Summary
Recent computer science graduate with internship experience in IT support.

Skills
Python, Linux, basic networking, SQL

Experience
IT Support Intern - Assisted with troubleshooting user issues, maintained documentation, and supported basic network configurations.

Education
Bachelor of Science in Computer Science`,
        jobDescription: `Responsibilities
Monitor security alerts and assist with incident response.
Support IT infrastructure and user access management.

Qualifications
Basic understanding of networking and security concepts.
Familiarity with Linux and scripting languages.`,
        targetRole: "Security Analyst",
        seniority: "Entry-level"
    },
    {
        name: "Senior software engineer",
        resumeText: `Summary
Senior software engineer with 8+ years of experience leading development teams and architecting scalable systems.

Skills
Java, Python, AWS, Kubernetes, React, Node.js, PostgreSQL, Redis

Experience
Senior Engineer - Led development of microservices architecture serving 1M+ users. Mentored junior developers and established coding standards.

Tech Lead - Architected and implemented CI/CD pipelines, reducing deployment time by 60%.

Education
Master of Science in Computer Science`,
        jobDescription: `Responsibilities
Lead development of scalable web applications using modern technologies.
Architect and implement cloud-native solutions.
Mentor junior developers and establish best practices.

Qualifications
8+ years software development experience.
Expert knowledge of cloud platforms (AWS/Azure/GCP).
Strong background in distributed systems and microservices.`,
        targetRole: "Senior Software Engineer",
        seniority: "Senior"
    },
    {
        name: "Empty resume failure case",
        resumeText: "",
        jobDescription: "Software engineer role with React and Node.js requirements.",
        targetRole: "",
        seniority: ""
    }
];

// Run evaluations
console.log("=== Resume Analyzer Evaluation ===\n");

for (const testCase of testCases) {
    console.log(`Test Case: ${testCase.name}`);
    console.log("-".repeat(50));

    const result = analyzeResume({
        resumeText: testCase.resumeText,
        jobDescription: testCase.jobDescription,
        targetRole: testCase.targetRole,
        seniority: testCase.seniority
    });

    if (result.refusal) {
        console.log("❌ Refusal:", result.refusal.title);
        console.log("   Message:", result.refusal.message);
    } else {
        console.log("✅ Analysis completed");
        console.log(`   Score: ${result.score ?? 'N/A'} (${result.scoreBand})`);
        console.log(`   Confidence: ${result.confidence.level}`);
        console.log(`   Strengths: ${result.strengths.length}`);
        console.log(`   Gaps: ${result.gaps.length}`);
        console.log(`   Suggestions: ${result.rewriteSuggestions.length}`);
    }

    console.log();
}

console.log("=== Comparison: Deterministic vs LLM Analysis ===\n");

// For a representative case, show what deterministic analysis provides
const repCase = testCases[1]; // Senior engineer case
const detResult = analyzeResume({
    resumeText: repCase.resumeText,
    jobDescription: repCase.jobDescription,
    targetRole: repCase.targetRole,
    seniority: repCase.seniority
});

console.log("Deterministic Analysis Results:");
console.log(`Score: ${detResult.score ?? 'N/A'} (${detResult.scoreBand})`);
console.log(`Confidence: ${detResult.confidence.level}`);
console.log(`Strengths found: ${detResult.strengths.length}`);
console.log(`Gaps identified: ${detResult.gaps.length}`);
console.log("\nNote: LLM analysis would provide more nuanced qualitative feedback");
console.log("while deterministic analysis gives quantitative scoring and structured gaps.");