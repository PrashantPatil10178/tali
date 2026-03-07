import React, { useState } from "react";
import { complexEducationalQuery } from "@tali/gemini/client";
import { TextbookSource } from "@tali/types";

interface HomeworkCreatorProps {
  sources: TextbookSource[];
}

const HomeworkCreator: React.FC<HomeworkCreatorProps> = ({ sources }) => {
  const [selectedSource, setSelectedSource] = useState<string>(
    sources[0]?.id || "",
  );
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [homework, setHomework] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const source = sources.find((s) => s.id === selectedSource);
      const prompt = `विषय: ${source?.name} (इयत्ता: ${source?.grade}). 
विषयाचा घटक: ${topic}.
या घटकावर आधारित विद्यार्थ्यांसाठी १० प्रश्नांचा एक कल्पक आणि सराव गृहपाठ (Homework Assignment) तयार करा. 
प्रश्नांचे स्वरूप: रिकाम्या जागा भरा, एका वाक्यात उत्तरे द्या आणि थोडक्यात उत्तरे लिहा. 
भाषा: साधी आणि सोपी मराठी.`;

      const result = await complexEducationalQuery(prompt, true);
      setHomework(result);
    } catch (err) {
      alert("गृहपाठ तयार करताना अडचण आली.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          गृहपाठ निर्माता (Homework Creator)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              पाठ्यपुस्तक निवडा
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.grade}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              धडा किंवा विषयाचा घटक
            </label>
            <input
              type="text"
              placeholder="उदा. बेरीज, सावित्रीबाई फुले, सूर्यमाला..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700"
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>गृहपाठ तयार होत आहे...</span>
            </>
          ) : (
            <>
              <span>गृहपाठ तयार करा</span>
              <span className="text-xl">✍️</span>
            </>
          )}
        </button>
      </div>

      {homework && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in zoom-in-95 duration-700">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-black text-indigo-900">
              नव्याने तयार केलेला गृहपाठ
            </h3>
            <button
              onClick={() => window.print()}
              className="text-indigo-600 font-bold flex items-center gap-2 hover:underline"
            >
              <span>प्रिंट काढा</span> 🖨️
            </button>
          </div>
          <div className="prose prose-indigo max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium text-lg">
              {homework}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkCreator;
