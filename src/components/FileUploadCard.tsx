"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import type { UploadedFile, InputMode, ExtractionState } from "@/types";
import {
  formatFileSize,
  getFileExtension,
  isValidFileType,
  isValidFileSize,
} from "@/lib/utils";

interface FileUploadCardProps {
  title: string;
  subtitle: string;
  allowedExtensions: string[];
  file: UploadedFile | null;
  text: string;
  mode: InputMode;
  extraction: ExtractionState;
  onFileChange: (file: UploadedFile | null) => void;
  onTextChange: (text: string) => void;
  onModeChange: (mode: InputMode) => void;
  onExtract: (file: File) => void;
  onPreview: () => void;
}

export default function FileUploadCard({
  title,
  subtitle,
  allowedExtensions,
  file,
  text,
  mode,
  extraction,
  onFileChange,
  onTextChange,
  onModeChange,
  onExtract,
  onPreview,
}: FileUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (selectedFile: File) => {
      setError(null);

      if (!isValidFileType(selectedFile.name, allowedExtensions)) {
        setError(
          `Invalid file type. Supported formats: ${allowedExtensions.join(", ")}`
        );
        return;
      }

      if (!isValidFileSize(selectedFile.size)) {
        setError("File size exceeds 10 MB limit.");
        return;
      }

      // Check for legacy .doc format
      const ext = getFileExtension(selectedFile.name).toLowerCase();
      if (ext === "doc") {
        setError(
          "Legacy .doc format is not supported for text extraction. Please convert to .docx or .pdf."
        );
        return;
      }

      const uploadedFile: UploadedFile = {
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
        extension: getFileExtension(selectedFile.name),
      };

      onFileChange(uploadedFile);
      onExtract(selectedFile);
    },
    [allowedExtensions, onFileChange, onExtract]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [handleFile]
  );

  const handleRemoveFile = useCallback(() => {
    onFileChange(null);
    onTextChange("");
    setError(null);
  }, [onFileChange, onTextChange]);

  const handleModeSwitch = useCallback(
    (newMode: InputMode) => {
      setError(null);
      onModeChange(newMode);
    },
    [onModeChange]
  );

  const formatsLabel = allowedExtensions.join(", ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
      {/* Card Header */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleModeSwitch("upload")}
          className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
            mode === "upload"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => handleModeSwitch("paste")}
          className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
            mode === "paste"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Paste Text
        </button>
      </div>

      {/* Error Message */}
      {(error || extraction.error) && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error || extraction.error}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1">
        {mode === "upload" ? (
          file ? (
            /* File Preview */
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file.extension} • {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Extraction Status */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                {extraction.status === "extracting" && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting text…</span>
                  </div>
                )}
                {extraction.status === "success" && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Text extracted successfully</span>
                    </div>
                    <button
                      onClick={onPreview}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview Extracted Text
                    </button>
                  </div>
                )}
                {extraction.status === "error" && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Extraction failed</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Drop Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Drop your file here
                </p>
                <p className="text-xs text-gray-400">
                  Supported formats: {formatsLabel}
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose File
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={allowedExtensions
                  .map((ext) => `.${ext.toLowerCase()}`)
                  .join(",")}
                onChange={handleInputChange}
              />
            </div>
          )
        ) : (
          /* Paste Text Area */
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={`Paste your ${title.toLowerCase()} content here...`}
            className="w-full h-44 border border-gray-300 rounded-lg p-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
      </div>
    </div>
  );
}
