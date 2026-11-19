import mammoth from "mammoth";

/**
 * Allowed MIME types mapped to their extensions
 */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "docx",
  ],
  "application/x-zip-compressed": ["docx"],
  "application/zip": ["docx"],
  "application/msword": ["doc", "docx"],
  "text/plain": ["txt"],
};

/**
 * Allowed extensions for extraction
 */
const EXTRACTABLE_EXTENSIONS = ["pdf", "docx", "txt"];

/**
 * Legacy DOC format extensions (not supported for extraction)
 */
const LEGACY_DOC_EXTENSIONS = ["doc"];

/**
 * Max file size: 10 MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Get file extension from filename (lowercase)
 */
function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Validate file before extraction
 */
export function validateFile(
  filename: string,
  mimeType: string,
  size: number
): string | null {
  const ext = getExtension(filename);

  // Check for legacy DOC format
  if (LEGACY_DOC_EXTENSIONS.includes(ext)) {
    return "Legacy .doc format is not supported. Please convert your document to .docx or .pdf and try again.";
  }

  // Check extension
  if (!EXTRACTABLE_EXTENSIONS.includes(ext)) {
    return `Unsupported file format ".${ext}". Supported formats: PDF, DOCX, TXT.`;
  }

  // Check MIME type if provided and not generic binary
  if (mimeType && mimeType !== "application/octet-stream") {
    if (
      mimeType.startsWith("image/") ||
      mimeType.startsWith("video/") ||
      mimeType.startsWith("audio/")
    ) {
      return `Invalid file type "${mimeType}". Only documents (PDF, DOCX, TXT) are supported.`;
    }
    const allowedExts = ALLOWED_MIME_TYPES[mimeType];
    if (allowedExts && !allowedExts.includes(ext)) {
      return `File type mismatch: extension ".${ext}" does not match content type "${mimeType}".`;
    }
  }

  // Check file size
  if (size > MAX_FILE_SIZE) {
    return `File size exceeds the 10 MB limit.`;
  }

  return null;
}

/**
 * Extract text from a PDF buffer using pdfjs-dist legacy build
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // In server-side Node.js / Next.js chunks, load the worker module into globalThis.pdfjsWorker
  // so PDF.js uses #mainThreadWorkerMessageHandler directly without attempting dynamic file imports
  if (!(globalThis as unknown as { pdfjsWorker?: unknown }).pdfjsWorker) {
    // @ts-expect-error pdfjs-dist legacy worker mjs does not have typescript declaration
    const workerModule = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    (globalThis as unknown as { pdfjsWorker?: unknown }).pdfjsWorker = workerModule;
  }

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;

  const pageTexts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .filter(Boolean)
      .join(" ");
    pageTexts.push(pageText);
  }

  const fullText = pageTexts.join("\n\n").trim();

  if (!fullText) {
    return "__EMPTY_PDF__";
  }

  return fullText;
}

/**
 * Extract text from a DOCX buffer using mammoth
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();

  if (!text) {
    return "__EMPTY_DOCX__";
  }

  return text;
}

/**
 * Extract text from a TXT buffer
 */
function extractTxtText(buffer: Buffer): string {
  const text = buffer.toString("utf-8").trim();

  if (!text) {
    return "__EMPTY_TXT__";
  }

  return text;
}

/**
 * Main extraction function - routes to the correct extractor based on file extension
 */
export async function extractText(
  filename: string,
  buffer: Buffer
): Promise<{ text: string; warning?: string }> {
  const ext = getExtension(filename);

  let rawText: string;

  switch (ext) {
    case "pdf":
      rawText = await extractPdfText(buffer);
      break;
    case "docx":
      rawText = await extractDocxText(buffer);
      break;
    case "txt":
      rawText = extractTxtText(buffer);
      break;
    default:
      throw new Error(`Unsupported file format: .${ext}`);
  }

  // Handle empty document markers
  if (rawText === "__EMPTY_PDF__") {
    return {
      text: "",
      warning:
        "No extractable text was found in this PDF. If this is a scanned document, OCR is not supported yet. Please paste the text manually.",
    };
  }

  if (rawText === "__EMPTY_DOCX__") {
    return {
      text: "",
      warning: "The document appears to be empty. No text content was found.",
    };
  }

  if (rawText === "__EMPTY_TXT__") {
    return {
      text: "",
      warning: "The file is empty. No text content was found.",
    };
  }

  return { text: rawText };
}

