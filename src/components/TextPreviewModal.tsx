"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TextPreviewModalProps {
  isOpen: boolean;
  title: string;
  text: string;
  onSave: (text: string) => void;
  onClose: () => void;
}

function ModalDialog({
  title,
  initialText,
  onSave,
  onClose,
}: {
  title: string;
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [editedText, setEditedText] = useState(initialText);

  const handleSave = () => {
    onSave(editedText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Preview: {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-6">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-80 border border-gray-300 rounded-lg p-3 text-sm text-gray-700 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="No text extracted..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TextPreviewModal({
  isOpen,
  title,
  text,
  onSave,
  onClose,
}: TextPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <ModalDialog
      key={`${title}-${text.length}`}
      title={title}
      initialText={text}
      onSave={onSave}
      onClose={onClose}
    />
  );
}
