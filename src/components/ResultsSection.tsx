"use client";

import { useState } from "react";
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  Building2,
  Briefcase,
  Layers,
  Copy,
  Check,
  Info,
  RefreshCw,
  MinusCircle,
  GraduationCap,
  FolderGit2,
  Globe2,
  Award,
  Edit3,
  Eye,
  ListFilter,
} from "lucide-react";
import type {
  AnalysisState,
  EducationItem,
  ProjectItem,
  ExperienceItem,
  TailoredCV,
} from "@/types";
import CVPreview from "./cv/CVPreview";
import CVDownloadButton from "./cv/CVDownloadButton";
import CVEditModal from "./cv/CVEditModal";

interface ResultsSectionProps {
  analysisState: AnalysisState;
  isDemo?: boolean;
  onReanalyze?: () => void;
  onUpdateTailoredCv?: (updatedCv: TailoredCV) => void;
}

export default function ResultsSection({
  analysisState,
  isDemo = false,
  onReanalyze,
  onUpdateTailoredCv,
}: ResultsSectionProps) {
  const { status, data, error } = analysisState;
  const [copied, setCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<"preview" | "content">("preview");

  // Helper to copy entire tailored CV to clipboard
  const handleCopyTailoredCv = () => {
    if (!data?.tailoredCV) return;
    const cv = data.tailoredCV;

    const sections = [
      cv.personalInfo?.fullName ? `${cv.personalInfo.fullName.toUpperCase()}\n` : "",
      cv.personalInfo?.email || cv.personalInfo?.phone || cv.personalInfo?.location
        ? `${[cv.personalInfo.email, cv.personalInfo.phone, cv.personalInfo.location].filter(Boolean).join(" | ")}\n`
        : "",
      `PROFESSIONAL SUMMARY\n${cv.professionalSummary}\n`,
      `TECHNICAL SKILLS\n${cv.technicalSkills.join(", ")}\n`,
      cv.experience.length > 0
        ? `EXPERIENCE\n${cv.experience
            .map((e) =>
              typeof e === "string"
                ? e
                : `${(e as ExperienceItem).role} | ${(e as ExperienceItem).company} ${(e as ExperienceItem).period ? `(${(e as ExperienceItem).period})` : ""}\n${(e as ExperienceItem).description || ""}`
            )
            .join("\n\n")}\n`
        : "",
      cv.projects.length > 0
        ? `PROJECTS\n${cv.projects
            .map((p) =>
              typeof p === "string"
                ? p
                : `${(p as ProjectItem).name}${(p as ProjectItem).technologies ? ` [${(p as ProjectItem).technologies?.join(", ")}]` : ""}\n${(p as ProjectItem).description}`
            )
            .join("\n\n")}\n`
        : "",
      cv.education.length > 0
        ? `EDUCATION\n${cv.education
            .map((ed) =>
              typeof ed === "string"
                ? ed
                : `${(ed as EducationItem).degree} - ${(ed as EducationItem).institution}`
            )
            .join("\n")}\n`
        : "",
      cv.languages.length > 0 ? `LANGUAGES\n${cv.languages.join(", ")}\n` : "",
      cv.certifications.length > 0 ? `CERTIFICATIONS\n${cv.certifications.join(", ")}\n` : "",
    ];

    navigator.clipboard.writeText(sections.filter(Boolean).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 1. Initial / Idle State
  if (status === "idle") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center transition-all">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ready to Generate
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            Upload your opportunity and master CV to get started.
          </p>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (status === "analyzing") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center transition-all">
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center relative">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Analyzing your CV and opportunity...
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Extracting requirements, computing verifiable skill compatibility, and preparing your tailored A4 PDF with Gemini AI.
            </p>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-600 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (status === "error") {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-10 text-center transition-all">
        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Analysis Failed
          </h3>
          <p className="text-sm text-red-600">
            {error || "An error occurred while communicating with the AI service. Please verify your inputs and try again."}
          </p>
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Success State (Structured Analysis & Tailored CV)
  if (!data) return null;

  const { opportunityAnalysis, compatibility, recommendations, tailoredCV, changesExplanation } = data;

  const score = compatibility.score;
  const scoreColor =
    score === null
      ? "text-gray-500"
      : score >= 75
      ? "text-emerald-600"
      : score >= 50
      ? "text-amber-600"
      : "text-rose-600";

  return (
    <div className="space-y-8">
      {/* Real Gemini Indicator */}
      {!isDemo && (
        <div className="flex items-center justify-between p-3.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Generated with Gemini {analysisState.modelName || "AI"}</strong> • Tailored authentically from your master CV
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            Real Gemini AI
          </span>
        </div>
      )}

      {/* Demo / Heuristic Notice */}
      {isDemo && (
        <div className="flex items-center gap-2.5 p-3.5 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Running in Heuristic Mode:</strong> To connect Google Gemini AI, add your{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950 font-bold">
              GEMINI_API_KEY
            </code>{" "}
            to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">.env.local</code>.
          </span>
        </div>
      )}

      {/* ==================== SECTION 1: OPPORTUNITY ANALYSIS ==================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Section 1: Opportunity Analysis
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">Extracted Criteria</span>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</span>
              <h4 className="text-lg font-bold text-gray-900">{opportunityAnalysis.jobTitle}</h4>
            </div>
            {opportunityAnalysis.companyName && (
              <div className="border-l border-gray-200 pl-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Company</span>
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {opportunityAnalysis.companyName}
                </p>
              </div>
            )}
          </div>

          {/* Required vs Preferred Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-3.5">
              <h5 className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">
                Required Technical Skills ({opportunityAnalysis.requiredSkills.length})
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {opportunityAnalysis.requiredSkills.length > 0 ? (
                  opportunityAnalysis.requiredSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs font-medium bg-white text-blue-900 border border-blue-200 rounded"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">None specifically isolated</span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Preferred / Nice-to-Have ({opportunityAnalysis.preferredSkills.length})
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {opportunityAnalysis.preferredSkills.length > 0 ? (
                  opportunityAnalysis.preferredSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs font-medium bg-white text-gray-700 border border-gray-200 rounded"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">None stated</span>
                )}
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          {opportunityAnalysis.responsibilities.length > 0 && (
            <div className="pt-1">
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Core Responsibilities
              </h5>
              <ul className="space-y-1.5">
                {opportunityAnalysis.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ==================== SECTION 2: COMPATIBILITY ==================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Section 2: Compatibility Evaluation
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">Explainable Server Assessment</span>
        </div>

        <div className="p-6 space-y-6">
          {/* Compatibility Score */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
            <div>
              <h4 className="text-base font-bold text-gray-900">
                Compatibility Rating
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Calculated directly from demonstrated required skills vs opportunity requirements.
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              {score !== null ? (
                <>
                  <span className={`text-4xl font-extrabold ${scoreColor}`}>{score}%</span>
                  <span className="text-xs text-gray-400 font-medium">match</span>
                </>
              ) : (
                <span className="text-sm font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-md">
                  Insufficient details for score
                </span>
              )}
            </div>
          </div>

          {/* Matched Skills with Evidence */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-semibold text-gray-900">
                Matching Skills with CV Evidence ({compatibility.matchedSkills.length})
              </h4>
            </div>
            <div className="space-y-2">
              {compatibility.matchedSkills.length > 0 ? (
                compatibility.matchedSkills.map((match, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        {match.name}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                        Verified
                      </span>
                    </div>
                    {match.evidence && (
                      <p className="text-gray-600 italic pl-5 border-l-2 border-emerald-300 ml-1 mt-1 text-[11px]">
                        &quot;{match.evidence}&quot;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No matching skills identified.</p>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MinusCircle className="w-4 h-4 text-rose-500" />
              <h4 className="text-sm font-semibold text-gray-900">
                Missing or Undemonstrated Skills ({compatibility.missingSkills.length})
              </h4>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">
              These requirements were not found in your Master CV and were <strong>strictly excluded</strong> from the tailored CV to avoid misrepresentation.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {compatibility.missingSkills.length > 0 ? (
                compatibility.missingSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 rounded-md"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-emerald-600">All identified skills demonstrated!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 3: AI RECOMMENDATIONS ==================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Section 3: AI Tailoring Recommendations
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">Strategic Advice</span>
        </div>

        <div className="p-6">
          <ul className="space-y-3">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs text-gray-700 leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                  {idx + 1}
                </span>
                <span className="pt-0.5">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ==================== SECTION 4: TAILORED CV, LIVE PREVIEW & PDF EXPORT ==================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Section 4 Header */}
        <div className="p-5 sm:px-6 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Section 4: Tailored CV &amp; Live PDF Export
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Fixed professional A4 template • Fully customizable content
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-500" />
              <span>Customize Content</span>
            </button>
            <CVDownloadButton
              cv={tailoredCV}
              jobTitle={opportunityAnalysis.jobTitle}
            />
          </div>
        </div>

        {/* View Toggle Bar (Live Preview vs Structured View) */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 bg-white flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg gap-1">
            <button
              onClick={() => setActiveViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeViewMode === "preview"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live A4 PDF Preview
            </button>
            <button
              onClick={() => setActiveViewMode("content")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeViewMode === "content"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Structured Content
            </button>
          </div>

          <button
            onClick={handleCopyTailoredCv}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy Raw Text</span>
              </>
            )}
          </button>
        </div>

        {/* Changes Explanation Summary */}
        {changesExplanation.length > 0 && (
          <div className="mx-6 my-4 bg-blue-50/50 border border-blue-100 rounded-lg p-3.5">
            <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
              What Was Tailored &amp; Why:
            </h5>
            <ul className="space-y-1">
              {changesExplanation.map((exp, idx) => (
                <li key={idx} className="text-xs text-blue-800 flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab 1: Live A4 PDF Viewer */}
        {activeViewMode === "preview" && (
          <div className="p-6">
            <CVPreview
              cv={tailoredCV}
              jobTitle={opportunityAnalysis.jobTitle}
            />
          </div>
        )}

        {/* Tab 2: Structured Content View */}
        {activeViewMode === "content" && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Personal Info Header */}
            {tailoredCV.personalInfo && (
              <div className="space-y-1.5 border-b border-gray-100 pb-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Verified Contact Details
                </h4>
                <p className="text-base font-bold text-gray-900">{tailoredCV.personalInfo.fullName}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  {tailoredCV.personalInfo.email && <span>{tailoredCV.personalInfo.email}</span>}
                  {tailoredCV.personalInfo.phone && <span>• {tailoredCV.personalInfo.phone}</span>}
                  {tailoredCV.personalInfo.location && <span>• {tailoredCV.personalInfo.location}</span>}
                  {tailoredCV.personalInfo.linkedin && <span>• {tailoredCV.personalInfo.linkedin}</span>}
                  {tailoredCV.personalInfo.portfolio && <span>• {tailoredCV.personalInfo.portfolio}</span>}
                </div>
              </div>
            )}

            {/* A. Professional Summary */}
            <div className="space-y-2 border-b border-gray-100 pb-6">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Professional Summary
              </h4>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50/60 p-4 rounded-lg border border-gray-100">
                {tailoredCV.professionalSummary}
              </p>
            </div>

            {/* B. Technical Skills */}
            <div className="space-y-2 border-b border-gray-100 pb-6">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Prioritized Technical Skills ({tailoredCV.technicalSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tailoredCV.technicalSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md border border-gray-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* C. Experience */}
            {tailoredCV.experience.length > 0 && (
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Work Experience
                </h4>
                <div className="space-y-3">
                  {tailoredCV.experience.map((exp, idx) => {
                    if (typeof exp === "string") {
                      return (
                        <p key={idx} className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {exp}
                        </p>
                      );
                    }
                    const e = exp as ExperienceItem;
                    return (
                      <div key={idx} className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900">{e.role}</span>
                          <span className="text-[11px] text-gray-500">{e.period}</span>
                        </div>
                        <p className="text-xs font-medium text-blue-700">{e.company}</p>
                        {e.description && (
                          <p className="text-xs text-gray-600 leading-relaxed">{e.description}</p>
                        )}
                        {e.bulletPoints && e.bulletPoints.length > 0 && (
                          <ul className="space-y-1 pt-1">
                            {e.bulletPoints.map((bp, bidx) => (
                              <li key={bidx} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="text-gray-400">•</span>
                                <span>{bp}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* D. Projects */}
            {tailoredCV.projects.length > 0 && (
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  Key Projects
                </h4>
                <div className="space-y-3">
                  {tailoredCV.projects.map((proj, idx) => {
                    if (typeof proj === "string") {
                      return (
                        <p key={idx} className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {proj}
                        </p>
                      );
                    }
                    const p = proj as ProjectItem;
                    return (
                      <div key={idx} className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900">{p.name}</span>
                          {p.technologies && (
                            <div className="flex flex-wrap gap-1">
                              {p.technologies.map((t, tidx) => (
                                <span key={tidx} className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{p.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* E. Education */}
            {tailoredCV.education.length > 0 && (
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Education (Preserved)
                </h4>
                <div className="space-y-2">
                  {tailoredCV.education.map((edu, idx) => {
                    if (typeof edu === "string") {
                      return (
                        <p key={idx} className="text-xs text-gray-700">
                          {edu}
                        </p>
                      );
                    }
                    const ed = edu as EducationItem;
                    return (
                      <div key={idx} className="flex justify-between items-baseline text-xs">
                        <div>
                          <span className="font-semibold text-gray-900">{ed.degree}</span>
                          <span className="text-gray-500"> — {ed.institution}</span>
                        </div>
                        {ed.period && <span className="text-gray-400 text-[11px]">{ed.period}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* F. Languages & Certifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tailoredCV.languages.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5" />
                    Languages
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tailoredCV.languages.map((l, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tailoredCV.certifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    Certifications
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tailoredCV.certifications.map((c, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Section 4 Footer Bar */}
        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-500" />
              <span>Customize Content</span>
            </button>
            {onReanalyze && (
              <button
                onClick={onReanalyze}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-analyze
              </button>
            )}
          </div>

          <CVDownloadButton
            cv={tailoredCV}
            jobTitle={opportunityAnalysis.jobTitle}
          />
        </div>
      </div>

      {/* Content Editing Modal */}
      <CVEditModal
        isOpen={isEditModalOpen}
        cv={tailoredCV}
        onSave={(updated) => {
          if (onUpdateTailoredCv) {
            onUpdateTailoredCv(updated);
          }
        }}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
