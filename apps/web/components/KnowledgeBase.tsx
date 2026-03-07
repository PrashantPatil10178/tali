import React, { useState } from "react";
import { TextbookSource } from "@tali/types";

const INITIAL_KNOWLEDGE: TextbookSource[] = [
  {
    id: "1",
    name: "Std 1 and 2",
    grade: "१ ली व २ री",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
  {
    id: "2",
    name: "Std 3",
    grade: "३ री",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
  {
    id: "3",
    name: "Std 4",
    grade: "४ थी",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
  {
    id: "4",
    name: "Std 5 and 6",
    grade: "५ वी व ६ वी",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
  {
    id: "5",
    name: "Std 7 and 8",
    grade: "७ वी व ८ वी",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
];

const KnowledgeBase: React.FC = () => {
  const [sources, setSources] = useState<TextbookSource[]>(INITIAL_KNOWLEDGE);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulating upload delay
      setTimeout(() => {
        const newSource: TextbookSource = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name.replace(".pdf", ""),
          grade: "इतर",
          uploadDate: new Date().toISOString().split("T")[0],
          isSystem: false,
        };
        setSources((prev) => [newSource, ...prev]);
        setIsUploading(false);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            ज्ञान भांडार (Knowledge Base)
          </h2>
          <p className="text-slate-500 text-sm">
            माझ्याकडे असलेली पाठ्यपुस्तके आणि तुमचे साहित्य
          </p>
        </div>
        <label
          className={`cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <svg
            className={`w-5 h-5 ${isUploading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isUploading ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            )}
          </svg>
          {isUploading ? "अपलोड होत आहे..." : "नवीन पीडीएफ जोडा"}
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <div
            key={source.id}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex items-start gap-4 relative group"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${source.isSystem ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate pr-6">
                {source.name}
              </h3>
              <p className="text-xs text-slate-400 mb-2">
                इयत्ता: {source.grade}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  अपलोड: {source.uploadDate}
                </span>
                {source.isSystem && (
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded">
                    मूळ पुस्तक
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 text-amber-800 flex gap-4">
        <div className="text-2xl">💡</div>
        <div className="text-sm leading-relaxed">
          <p className="font-bold mb-1">लक्षात ठेवा:</p>
          तुम्ही जोडलेल्या नवीन पीडीएफचा वापर मी प्रश्नपत्रिका आणि गृहपाठ तयार
          करण्यासाठी करू शकेन. कृपया स्पष्ट आणि वाचनीय पीडीएफ अपलोड करा जेणेकरून
          मी त्यातील माहिती अचूकपणे समजू शकेन.
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
