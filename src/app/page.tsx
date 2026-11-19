"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import FileUploadCard from "@/components/FileUploadCard";
import ResultsSection from "@/components/ResultsSection";
import TextPreviewModal from "@/components/TextPreviewModal";
import { extractTextFromFile, analyzeCvRequest } from "@/lib/api";
import type {
  UploadedFile,
  InputMode,
  ExtractionState,
  AnalysisState,
  TailoredCV,
} from "@/types";

const JOB_EXTENSIONS = ["PDF", "DOCX", "TXT", "DOC"];
const CV_EXTENSIONS = ["PDF", "DOCX", "DOC"];

const initialExtractionState: ExtractionState = {
  status: "idle",
  text: "",
  error: null,
};

const initialAnalysisState: AnalysisState = {
  status: "idle",
  data: null,
  error: null,
};

export default function Home() {
  // Job description state
  const [jobFile, setJobFile] = useState<UploadedFile | null>(null);
  const [jobText, setJobText] = useState("");
  const [jobMode, setJobMode] = useState<InputMode>("upload");
  const [jobExtraction, setJobExtraction] = useState<ExtractionState>(
    initialExtractionState
  );

  // Master CV state
  const [cvFile, setCvFile] = useState<UploadedFile | null>(null);
  const [cvText, setCvText] = useState("");
  const [cvMode, setCvMode] = useState<InputMode>("upload");
  const [cvExtraction, setCvExtraction] = useState<ExtractionState>(
    initialExtractionState
  );

  // Compatibility Analysis state
  const [analysisState, setAnalysisState] = useState<AnalysisState>(
    initialAnalysisState
  );
  const [isDemo, setIsDemo] = useState(false);

  // Preview modal state
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    text: string;
    target: "job" | "cv";
  }>({
    isOpen: false,
    title: "",
    text: "",
    target: "job",
  });

  // Extract text from Job file
  const handleJobExtract = useCallback(async (file: File) => {
    setJobExtraction({ status: "extracting", text: "", error: null });

    const result = await extractTextFromFile(file);

    if (result.success && result.text) {
      setJobExtraction({ status: "success", text: result.text, error: null });
      setJobText(result.text);
    } else {
      setJobExtraction({
        status: "error",
        text: "",
        error: result.error || "Failed to extract text from the file.",
      });
      setJobText("");
    }
  }, []);

  // Extract text from CV file
  const handleCvExtract = useCallback(async (file: File) => {
    setCvExtraction({ status: "extracting", text: "", error: null });

    const result = await extractTextFromFile(file);

    if (result.success && result.text) {
      setCvExtraction({ status: "success", text: result.text, error: null });
      setCvText(result.text);
    } else {
      setCvExtraction({
        status: "error",
        text: "",
        error: result.error || "Failed to extract text from the file.",
      });
      setCvText("");
    }
  }, []);

  // Handle modal save
  const handleModalSave = useCallback(
    (newText: string) => {
      if (previewModal.target === "job") {
        setJobText(newText);
        setJobExtraction((prev) => ({ ...prev, text: newText }));
      } else {
        setCvText(newText);
        setCvExtraction((prev) => ({ ...prev, text: newText }));
      }
    },
    [previewModal.target]
  );

  // Handle mode switches
  const handleJobModeChange = useCallback((mode: InputMode) => {
    setJobMode(mode);
    if (mode === "paste") {
      setJobFile(null);
      setJobExtraction(initialExtractionState);
    } else {
      setJobText("");
    }
  }, []);

  const handleCvModeChange = useCallback((mode: InputMode) => {
    setCvMode(mode);
    if (mode === "paste") {
      setCvFile(null);
      setCvExtraction(initialExtractionState);
    } else {
      setCvText("");
    }
  }, []);

  // Handle file changes (including removal)
  const handleJobFileChange = useCallback((file: UploadedFile | null) => {
    setJobFile(file);
    if (!file) {
      setJobText("");
      setJobExtraction(initialExtractionState);
    }
  }, []);

  const handleCvFileChange = useCallback((file: UploadedFile | null) => {
    setCvFile(file);
    if (!file) {
      setCvText("");
      setCvExtraction(initialExtractionState);
    }
  }, []);

  // Handle Compatibility Analysis & CV Tailoring
  const handleAnalyze = useCallback(async () => {
    if (!jobText.trim() || !cvText.trim() || analysisState.status === "analyzing") return;

    setAnalysisState({ status: "analyzing", data: null, error: null });

    const result = await analyzeCvRequest(jobText, cvText);

    if (result.success && result.data) {
      setAnalysisState({
        status: "success",
        data: result.data,
        error: null,
        modelName: result.modelName,
      });
      setIsDemo(Boolean(result.isDemo));
    } else {
      setAnalysisState({
        status: "error",
        data: null,
        error: result.error || "Analysis failed. Please verify your inputs and try again.",
      });
    }
  }, [jobText, cvText, analysisState.status]);

  // Handle manual content customization
  const handleUpdateTailoredCv = useCallback((updatedCv: TailoredCV) => {
    setAnalysisState((prev) => {
      if (!prev.data) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          tailoredCV: updatedCv,
        },
      };
    });
  }, []);

  // Check if both inputs have valid, meaningful content
  const jobHasContent = jobText.trim().length > 0;
  const cvHasContent = cvText.trim().length > 0;

  const isExtracting =
    jobExtraction.status === "extracting" || cvExtraction.status === "extracting";
  const isAnalyzing = analysisState.status === "analyzing";

  const isReady = jobHasContent && cvHasContent && !isExtracting && !isAnalyzing;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUploadCard
            title="Job Description"
            subtitle="Upload or paste the job opportunity description"
            allowedExtensions={JOB_EXTENSIONS}
            file={jobFile}
            text={jobText}
            mode={jobMode}
            extraction={jobExtraction}
            onFileChange={handleJobFileChange}
            onTextChange={setJobText}
            onModeChange={handleJobModeChange}
            onExtract={handleJobExtract}
            onPreview={() =>
              setPreviewModal({
                isOpen: true,
                title: "Job Description",
                text: jobText,
                target: "job",
              })
            }
          />
          <FileUploadCard
            title="Master CV"
            subtitle="Upload or paste your original CV"
            allowedExtensions={CV_EXTENSIONS}
            file={cvFile}
            text={cvText}
            mode={cvMode}
            extraction={cvExtraction}
            onFileChange={handleCvFileChange}
            onTextChange={setCvText}
            onModeChange={handleCvModeChange}
            onExtract={handleCvExtract}
            onPreview={() =>
              setPreviewModal({
                isOpen: true,
                title: "Master CV",
                text: cvText,
                target: "cv",
              })
            }
          />
        </div>

        {/* Main Action Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={!isReady}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${
              isReady
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your CV and opportunity...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze &amp; Generate CV
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <ResultsSection
          analysisState={analysisState}
          isDemo={isDemo}
          onReanalyze={handleAnalyze}
          onUpdateTailoredCv={handleUpdateTailoredCv}
        />
      </main>

      {/* Extracted Text Preview Modal */}
      <TextPreviewModal
        isOpen={previewModal.isOpen}
        title={previewModal.title}
        text={previewModal.text}
        onSave={handleModalSave}
        onClose={() =>
          setPreviewModal((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}
