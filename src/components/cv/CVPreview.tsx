"use client";

import dynamic from "next/dynamic";
import { Loader2, FileText } from "lucide-react";
import type { TailoredCV } from "@/types";
import CVDocument from "./CVDocument";

// Dynamically load PDFViewer on client side only (prevents SSR errors)
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[580px] sm:h-[680px] bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-700">Rendering live PDF preview…</p>
        <p className="text-xs text-gray-400 mt-1">Applying fixed professional A4 template</p>
      </div>
    ),
  }
);

interface CVPreviewProps {
  cv: TailoredCV;
  jobTitle?: string;
}

export default function CVPreview({ cv, jobTitle }: CVPreviewProps) {
  return (
    <div className="w-full bg-slate-900/5 rounded-xl border border-gray-200 overflow-hidden shadow-inner flex flex-col">
      {/* Top Preview Toolbar info */}
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>A4 Document Preview</span>
          <span className="text-gray-400 font-normal hidden sm:inline">• Live PDF Rendering</span>
        </div>
        <span className="text-[11px] text-gray-400 hidden sm:inline">Use controls below to scroll &amp; zoom</span>
      </div>

      {/* PDFViewer iframe wrapper */}
      <div className="w-full h-[600px] sm:h-[720px] bg-slate-100 flex items-center justify-center">
        <PDFViewer
          className="w-full h-full border-none"
          showToolbar={true}
        >
          <CVDocument cv={cv} jobTitle={jobTitle} />
        </PDFViewer>
      </div>
    </div>
  );
}
