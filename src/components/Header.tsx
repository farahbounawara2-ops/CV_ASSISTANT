"use client";

import { FileText, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              CV Tailor AI
            </h1>
            <p className="text-xs text-gray-500">AI-powered CV adaptation</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4 text-green-500" />
          <span className="hidden sm:inline">Powered by AI</span>
        </div>
      </div>
    </header>
  );
}

