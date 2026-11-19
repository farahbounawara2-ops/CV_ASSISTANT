import { NextRequest } from "next/server";
import { analyzeAndTailorCv } from "@/lib/gemini";

// Maximum allowable input character limit (50,000 characters per document)
const MAX_INPUT_LENGTH = 50000;

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { jobDescription, masterCv } = body;

    // A & B: Reject missing or non-string inputs
    if (!jobDescription || typeof jobDescription !== "string") {
      return Response.json(
        { success: false, error: "Job description text is required." },
        { status: 400 }
      );
    }

    if (!masterCv || typeof masterCv !== "string") {
      return Response.json(
        { success: false, error: "Master CV text is required." },
        { status: 400 }
      );
    }

    const trimmedJob = jobDescription.trim();
    const trimmedCv = masterCv.trim();

    // Reject empty or whitespace-only inputs
    if (trimmedJob.length === 0) {
      return Response.json(
        { success: false, error: "Job description cannot be empty." },
        { status: 400 }
      );
    }

    if (trimmedCv.length === 0) {
      return Response.json(
        { success: false, error: "Master CV cannot be empty." },
        { status: 400 }
      );
    }

    // C: Apply reasonable length limits
    if (trimmedJob.length > MAX_INPUT_LENGTH) {
      return Response.json(
        {
          success: false,
          error: `Job description exceeds maximum limit of ${MAX_INPUT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    if (trimmedCv.length > MAX_INPUT_LENGTH) {
      return Response.json(
        {
          success: false,
          error: `Master CV exceeds maximum limit of ${MAX_INPUT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    // D, E, F: Execute analysis and CV tailoring with Gemini and validate output
    const { data, isDemo, modelName } = await analyzeAndTailorCv(trimmedJob, trimmedCv);

    // Ephemeral: Return structured JSON directly without storing on disk
    return Response.json({
      success: true,
      data,
      isDemo,
      modelName,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[API analyze-cv] Execution failed:", errorMsg);

    // Determine user-friendly error message based on error signature
    let clientError = "An unexpected error occurred during AI analysis. Please verify your inputs and try again.";
    let statusCode = 500;

    if (errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("UNAVAILABLE")) {
      clientError = "Google Gemini AI is currently experiencing high demand. Please click 'Try Again' in a moment.";
      statusCode = 503;
    } else if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("rate limit")) {
      clientError = "API rate limit reached. Please wait a few seconds and try again.";
      statusCode = 429;
    } else if (errorMsg.includes("API key not valid") || errorMsg.includes("INVALID_ARGUMENT")) {
      clientError = "Invalid Gemini API key. Please check your GEMINI_API_KEY in .env.local.";
      statusCode = 401;
    }

    return Response.json(
      {
        success: false,
        error: clientError,
      },
      { status: statusCode }
    );
  }
}

