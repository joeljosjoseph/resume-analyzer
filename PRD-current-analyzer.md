## Problem Statement

Job seekers applying to white-collar roles often want fast feedback on whether their resume aligns with a specific job description before they apply. Generic resume advice is often too broad to be useful, and general chatbots can produce feedback that feels ungrounded, inconsistent, or too willing to invent missing qualifications. The current analyzer exists to provide a focused, honest, and structured review of a resume against a pasted job description, while making the underlying reasoning visible enough for users to trust and act on it.

## Solution

The current analyzer is a single-page web app where a user uploads a PDF or DOCX resume, pastes a job description, confirms the extracted resume text, and then receives a grounded analysis. That analysis includes either a numeric match score or a low-confidence fallback band, the top five likely gaps, a small set of grounded rewrite suggestions, a few stronger signals already present in the resume, missing section checks, and a brief usefulness survey. The product is intentionally limited to evidence-based feedback derived from the confirmed resume text and the provided job description. It does not rewrite the resume for the user, fabricate experience, or attempt to act like a full career coach.

## User Stories

1. As a job seeker, I want to upload my resume as a PDF so that I can analyze the version I already use for applications.
2. As a job seeker, I want to upload my resume as a DOCX so that I have a fallback format when PDF extraction is weak.
3. As a job seeker, I want to paste a job description directly into the app so that the feedback is tailored to the specific role.
4. As a job seeker, I want to optionally note a target role title so that the analyzer can preserve that context in the review.
5. As a job seeker, I want to optionally specify seniority so that the analyzer can reflect role level in its output context.
6. As a job seeker, I want the app to refuse unsupported file types so that I do not assume the analysis is valid when the input format is not supported.
7. As a job seeker, I want the app to block analysis when no job description is provided so that the feedback stays job-specific rather than drifting into generic advice.
8. As a job seeker, I want the app to extract text from my uploaded resume so that I can use the analyzer without manually retyping my resume.
9. As a job seeker, I want to review and edit extracted resume text before analysis so that parser mistakes do not silently distort the result.
10. As a job seeker, I want parsing warnings surfaced clearly so that I understand when the app may be missing resume content.
11. As a job seeker, I want the analyzer to return a refusal when the confirmed resume text is empty so that it does not pretend to evaluate missing content.
12. As a job seeker, I want the analyzer to return a refusal when the job description is too incomplete to interpret so that it does not produce false precision.
13. As a job seeker, I want a directional match score when confidence is sufficient so that I can quickly understand overall alignment.
14. As a job seeker, I want a qualitative fallback band instead of a number when confidence is too low so that the product does not overstate certainty.
15. As a job seeker, I want a short score explanation so that I understand the score is guidance rather than a hiring prediction.
16. As a job seeker, I want the analyzer to distinguish between high, medium, and low confidence so that I can judge how much to trust the output.
17. As a job seeker, I want the analyzer to explain why confidence dropped so that I know whether the issue came from parsing, weak job-description detail, or sparse evidence.
18. As a job seeker, I want to see the top five gaps first so that I can focus on the biggest alignment problems quickly.
19. As a job seeker, I want each gap to cite the relevant job requirement so that the feedback feels grounded in the role.
20. As a job seeker, I want each gap to show which resume section was reviewed so that I know where the issue was detected.
21. As a job seeker, I want each gap to use a judgment label such as missing, weakly demonstrated, or not clearly shown so that the analyzer does not flatten every issue into the same severity.
22. As a job seeker, I want each gap to explain why it matters so that I can understand the implication of the mismatch.
23. As a job seeker, I want the analyzer to identify strengths already present in my resume so that the output is balanced and not only negative.
24. As a job seeker, I want rewrite suggestions that stay grounded in my existing content so that the analyzer does not invent skills or accomplishments.
25. As a job seeker, I want rewrite suggestions tied to a specific target section so that I can act on them outside the app.
26. As a job seeker, I want rewrite suggestions to map back to the relevant job requirement so that the revision advice is clearly justified.
27. As a job seeker, I want the analyzer to flag missing resume sections so that I can understand whether structural gaps may be hurting clarity.
28. As a job seeker, I want the analyzer to tell me when a missing section is important versus optional so that I am not pushed toward needless resume boilerplate.
29. As a job seeker, I want the app to avoid overemphasizing personal contact information so that sensitive data is not central to the feedback.
30. As a collaborator, I want parsing and analysis logic separated from the UI so that the core behavior can be reasoned about and tested independently.
31. As a collaborator, I want the product rules around non-fabrication and grounded evidence to be explicit so that future changes do not weaken trust.
32. As a collaborator, I want confidence handling to be part of the product design rather than an afterthought so that failure modes stay honest.
33. As a collaborator, I want a clear record of what this analyzer does not attempt to do so that future scope discussions start from a shared baseline.
34. As a collaborator, I want a simple usefulness survey in the current app so that future improvements can be informed by actual user reactions.
35. As a collaborator, I want the current analyzer documented as a one-shot review tool so that it is not confused with a resume builder or editing workflow.

## Implementation Decisions

- The current analyzer is a client-rendered single-page application with a single intake-to-results flow rather than a multi-page workflow.
- Resume parsing is its own module, responsible for format detection, PDF extraction, DOCX extraction, text cleanup, and parser warnings.
- PDF parsing uses PDF.js with an explicitly configured worker source before documents are loaded.
- DOCX parsing uses Mammoth to extract raw text rather than preserve formatting fidelity.
- The analyzer requires user confirmation of extracted text before analysis, treating the edited text as the ground truth input.
- Grounded requirement analysis is its own module, separate from UI concerns.
- The analysis module normalizes text, infers resume sections, derives requirement candidates from the job description, extracts lightweight keyword signals, and scores alignment heuristically.
- Requirement ranking is based on job-description wording and simple priority signals such as required language, preferred language, and role-central verbs.
- The analyzer uses explicit judgment labels to distinguish between clearly missing evidence, partial evidence, and fully demonstrated evidence.
- The analyzer produces a numeric score only when confidence is not low. Otherwise, it produces a qualitative alignment band.
- Confidence is based on observable input quality factors such as extracted resume length, job-description length, inferred requirement count, and parser warnings.
- The app includes explicit refusal states when the resume text is empty or the job description lacks enough usable detail.
- Rewrite suggestions are constrained to clarifying or surfacing existing evidence rather than generating new content for the user.
- Missing-section checks are intentionally lightweight and based on common section headings rather than advanced document structure inference.
- The UI combines intake, extraction confirmation, and results display into one page to keep the current analyzer simple and easy to demo.
- The product is intentionally a one-shot analyzer. It does not support saved sessions, version comparisons, or in-app resume editing workflows.
- The product promise is grounded, structured feedback rather than authoritative hiring prediction.
- The app includes a short post-analysis survey with Yes, Somewhat, or No plus an optional note to gauge whether the feedback felt specific enough to change the resume.

## Testing Decisions

- Good tests should validate externally observable behavior rather than implementation details. They should focus on what inputs produce what outputs, not on internal helper sequencing.
- Resume parsing should be tested first because it determines whether the rest of the app receives trustworthy input.
- Grounded requirement analysis should be tested first because it contains the core scoring, gap detection, confidence handling, and refusal behavior.
- Parsing tests should cover file type acceptance, empty or weak extraction behavior, and warning propagation.
- Analysis tests should cover refusal states, low-confidence fallback behavior, ranking of gaps, detection of strengths, and the non-fabricated nature of rewrite suggestions.
- UI tests can come later and should focus on workflow behavior such as requiring a job description before extraction, exposing editable extracted text, and rendering analysis or refusal states based on module outputs.
- The current codebase is light on existing test prior art, so new tests should establish a simple behavioral style that future collaborators can extend.

## Out of Scope

- Automatic resume rewriting inside the product.
- Cover letter generation.
- Broad career-coaching functionality.
- Hiring predictions or claims about interview outcomes.
- Fabrication of missing skills, metrics, responsibilities, or accomplishments.
- Persistent storage of uploaded resumes or job descriptions beyond the current session.
- Recruiter-facing features, employer dashboards, or school/cohort workflows.
- Deep visual formatting critique beyond readability and parsing-related concerns.
- OCR support for scanned image-only resumes.
- User accounts, billing, saved history, and resume version management.
- Advanced model-based semantic matching beyond the current heuristic analyzer.

## Further Notes

- The intended audience for this PRD is the project owner and future collaborators who need a clear record of current behavior, the reasoning behind it, and the current boundaries of the product.
- The current analyzer should be understood as a working prototype with explicit trust guardrails, not as a complete production hiring product.
- The most important product risk remains generic-feeling feedback, even when technically correct. The strongest current defense against that risk is the requirement that feedback be tied to a specific job requirement and a specific resume section.
