"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import type { TailoredCV } from "@/types";

interface CVDownloadButtonProps {
  cv: TailoredCV;
  jobTitle?: string;
  className?: string;
}

export default function CVDownloadButton({
  cv,
  jobTitle,
  className = "",
}: CVDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Generate safe filename based on candidate and target job title
  const candidateName = cv.personalInfo?.fullName
    ? cv.personalInfo.fullName.replace(/[^a-zA-Z0-9]/g, "_")
    : "Candidate";
  const roleName = jobTitle
    ? jobTitle.replace(/[^a-zA-Z0-9]/g, "_")
    : "Tailored";
  const fileName = `CV_${candidateName}_${roleName}.pdf`;

  const handleDownload = async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);

      // Dynamically import @react-pdf/renderer and CVDocument to ensure clean client-side rendering
      const { pdf } = await import("@react-pdf/renderer");
      const { default: CVDocument } = await import("./CVDocument");

      const doc = <CVDocument cv={cv} jobTitle={jobTitle} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      // Trigger native browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all ${
        downloaded
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : isGenerating
          ? "bg-blue-400 text-white cursor-wait"
          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 cursor-pointer"
      } ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating PDF…</span>
        </>
      ) : downloaded ? (
        <>
          <Check className="w-4 h-4" />
          <span>Downloaded!</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Download CV as PDF</span>
        </>
      )}
    </button>
  );
}
