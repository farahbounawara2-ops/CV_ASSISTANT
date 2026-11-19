"use client";

import { useState } from "react";
import { X, Sparkles, Check } from "lucide-react";
import type { TailoredCV, ProjectItem } from "@/types";

interface CVEditModalProps {
  isOpen: boolean;
  cv: TailoredCV;
  onSave: (updatedCv: TailoredCV) => void;
  onClose: () => void;
}

export default function CVEditModal({
  isOpen,
  cv,
  onSave,
  onClose,
}: CVEditModalProps) {
  // Local state initialized with current CV values
  const [fullName, setFullName] = useState(cv.personalInfo?.fullName || "");
  const [email, setEmail] = useState(cv.personalInfo?.email || "");
  const [phone, setPhone] = useState(cv.personalInfo?.phone || "");
  const [location, setLocation] = useState(cv.personalInfo?.location || "");
  const [linkedin, setLinkedin] = useState(cv.personalInfo?.linkedin || "");
  const [portfolio, setPortfolio] = useState(cv.personalInfo?.portfolio || "");

  const [summary, setSummary] = useState(cv.professionalSummary || "");
  const [skillsText, setSkillsText] = useState(cv.technicalSkills?.join(", ") || "");

  // Projects text editing (one project per line or simplified)
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(
    (cv.projects || []).map((p) =>
      typeof p === "string" ? { name: "Project", description: p } : p
    )
  );

  // Active section tab
  const [activeTab, setActiveTab] = useState<"summary" | "skills" | "contact" | "projects">("summary");

  if (!isOpen) return null;

  const handleSave = () => {
    const updatedSkills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedCv: TailoredCV = {
      ...cv,
      personalInfo: {
        fullName: fullName.trim() || "Candidate",
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
      },
      professionalSummary: summary.trim(),
      technicalSkills: updatedSkills,
      projects: projectsList,
    };

    onSave(updatedCv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Customize Tailored CV Content
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Modify content while strictly preserving the professional fixed A4 template.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-white gap-2">
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "summary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "skills"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Technical Skills
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "projects"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "contact"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Contact Info
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "summary" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">
                Professional Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={7}
                className="w-full text-xs text-gray-800 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans leading-relaxed"
                placeholder="Enter professional summary..."
              />
              <p className="text-[11px] text-gray-500">
                Highlight your most compelling qualifications and value proposition for the target role.
              </p>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">
                Technical Skills (Comma Separated)
              </label>
              <textarea
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                rows={5}
                className="w-full text-xs text-gray-800 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none leading-relaxed"
                placeholder="TypeScript, React, Node.js, PostgreSQL..."
              />
              <p className="text-[11px] text-gray-500">
                Prioritize skills that directly align with the job description. Do not add skills you do not possess.
              </p>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Key Projects ({projectsList.length})
                </label>
              </div>
              {projectsList.map((proj, idx) => (
                <div key={idx} className="p-3.5 border border-gray-200 rounded-lg bg-gray-50/50 space-y-2">
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => {
                      const updated = [...projectsList];
                      updated[idx].name = e.target.value;
                      setProjectsList(updated);
                    }}
                    placeholder="Project Name"
                    className="w-full text-xs font-bold text-gray-900 bg-white p-2 rounded border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <textarea
                    value={proj.description}
                    onChange={(e) => {
                      const updated = [...projectsList];
                      updated[idx].description = e.target.value;
                      setProjectsList(updated);
                    }}
                    rows={2}
                    placeholder="Project description and key deliverables..."
                    className="w-full text-xs text-gray-700 bg-white p-2 rounded border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === "contact" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full text-xs text-gray-800 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full text-xs text-gray-800 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full text-xs text-gray-800 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full text-xs text-gray-800 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">LinkedIn URL</label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="mt-1 w-full text-xs text-gray-800 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">GitHub / Portfolio</label>
                <input
                  type="text"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="mt-1 w-full text-xs text-gray-800 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Changes to PDF
          </button>
        </div>
      </div>
    </div>
  );
}
