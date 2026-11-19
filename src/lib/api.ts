import type { ExtractTextResponse, AnalyzeCvApiResponse } from "@/types";

/**
 * Send a file to the extraction API and return the extracted text
 */
export async function extractTextFromFile(
  file: File
): Promise<ExtractTextResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract-text", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    return {
      success: false,
      error: data.error || "An unexpected error occurred during text extraction.",
    };
  }

  return {
    success: true,
    text: data.text,
  };
}

/**
 * Send job description and master CV to /api/analyze-cv for Gemini AI analysis and tailoring
 */
export async function analyzeCvRequest(
  jobDescription: string,
  masterCv: string
): Promise<AnalyzeCvApiResponse> {
  try {
    const response = await fetch("/api/analyze-cv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobDescription,
        masterCv,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to analyze and tailor CV.",
      };
    }

    return {
      success: true,
      data: data.data,
      isDemo: data.isDemo,
      modelName: data.modelName,
    };
  } catch (error: unknown) {
    console.error("Client API error:", error);
    return {
      success: false,
      error: "Unable to connect to analysis service. Please check your network.",
    };
  }
}
