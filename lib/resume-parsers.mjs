function cleanExtractedText(text) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function detectResumeFormat(file) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    return "pdf";
  }

  if (lowerName.endsWith(".docx")) {
    return "docx";
  }

  return null;
}

export async function parseResumeFile(file) {
  const format = detectResumeFormat(file);

  if (!format) {
    throw new Error("Only PDF and DOCX resumes are supported right now.");
  }

  if (format === "pdf") {
    return parsePdfResume(file);
  }

  return parseDocxResume(file);
}

async function parsePdfResume(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    pages.push(pageText);
  }

  const text = cleanExtractedText(pages.join("\n\n"));
  const issues = [];

  if (text.length < 250) {
    issues.push("Very little text was extracted from the PDF. The layout may be image-based or difficult to parse.");
  }

  return {
    text,
    format: "pdf",
    issues,
  };
}

async function parseDocxResume(file) {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return {
    text: cleanExtractedText(result.value),
    format: "docx",
    issues: result.messages.map((message) => message.message),
  };
}
