import { NextRequest } from "next/server";
import { validateFile, extractText } from "@/lib/extraction";

export async function POST(request: NextRequest) {
  let fileName = "unknown";
  let fileSize = 0;
  let fileType = "unknown";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { success: false, error: "No file provided. Please select a document." },
        { status: 400 }
      );
    }

    fileName = file.name;
    fileSize = file.size;
    fileType = file.type || "unknown";

    // Validate the file
    const validationError = validateFile(file.name, file.type, file.size);
    if (validationError) {
      console.warn(
        `[Document Extraction] Validation rejected for "${fileName}" (${fileSize} bytes, type "${fileType}"): ${validationError}`
      );
      return Response.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    const result = await extractText(file.name, buffer);

    if (result.warning) {
      console.warn(
        `[Document Extraction] Content warning for "${fileName}" (${fileSize} bytes): ${result.warning}`
      );
      return Response.json(
        {
          success: false,
          category: "no_text_found",
          error: result.warning,
          text: "",
        },
        { status: 422 }
      );
    }

    console.log(
      `[Document Extraction] Successfully extracted ${result.text.length} characters from "${fileName}" (${fileSize} bytes).`
    );

    return Response.json({
      success: true,
      text: result.text,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "UnknownError";

    // Safe server diagnostic logging without exposing document contents or sensitive data
    console.error(
      `[Document Extraction] Extraction failed for "${fileName}" (${fileSize} bytes, type "${fileType}"): [${errorName}] ${errorMsg}`
    );

    const message = errorMsg.toLowerCase();

    if (
      message.includes("invalid") ||
      message.includes("corrupt") ||
      message.includes("malformed") ||
      message.includes("password") ||
      message.includes("encrypted") ||
      message.includes("bad xref")
    ) {
      return Response.json(
        {
          success: false,
          category: "corrupted_or_encrypted",
          error:
            "The document appears to be corrupted or password-protected. Please upload an unencrypted, valid document.",
        },
        { status: 422 }
      );
    }

    return Response.json(
      {
        success: false,
        category: "extraction_error",
        error:
          "Unable to extract text from this document. Please ensure the file is valid or paste your text directly.",
      },
      { status: 500 }
    );
  }
}

