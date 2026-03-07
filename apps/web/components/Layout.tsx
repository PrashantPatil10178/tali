import React from "react";
import { AppSection } from "@tali/types";

interface LayoutProps {
  children: React.ReactNode;
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeSection,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-800 text-white p-6 sticky top-0 h-screen">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg">
            <svg
              className="w-8 h-8 text-indigo-800"
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
          <h1 className="text-2xl font-bold tracking-tight">गुरुजी AI</h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <button
            onClick={() => onNavigate(AppSection.DASHBOARD)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSection === AppSection.DASHBOARD ? "bg-indigo-700 shadow-inner" : "hover:bg-indigo-700/50"}`}
          >
            <span className="text-xl">🏠</span> मुख्य पृष्ठ
          </button>
          <button
            onClick={() => onNavigate(AppSection.STUDENTS)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSection === AppSection.STUDENTS ? "bg-indigo-700 shadow-inner" : "hover:bg-indigo-700/50"}`}
          >
            <span className="text-xl">👥</span> विद्यार्थी
          </button>
          <button
            onClick={() => onNavigate(AppSection.ATTENDANCE)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSection === AppSection.ATTENDANCE ? "bg-indigo-700 shadow-inner" : "hover:bg-indigo-700/50"}`}
          >
            <span className="text-xl">📅</span> हजेरी
          </button>
          <button
            onClick={() => onNavigate(AppSection.HOMEWORK)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSection === AppSection.HOMEWORK ? "bg-indigo-700 shadow-inner" : "hover:bg-indigo-700/50"}`}
          >
            <span className="text-xl">✏️</span> गृहपाठ निर्माता
          </button>
          <button
            onClick={() => onNavigate(AppSection.KNOWLEDGE)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSection === AppSection.KNOWLEDGE ? "bg-indigo-700 shadow-inner" : "hover:bg-indigo-700/50"}`}
          >
            <span className="text-xl">📚</span> ज्ञान भांडार
          </button>
          <button
            onClick={() => onNavigate(AppSection.SCAN)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSection === AppSection.SCAN ? "bg-indigo-700 shadow-inner" : "hover:bg-indigo-700/50"}`}
          >
            <span className="text-xl">📷</span> स्कॅन करा
          </button>
          <button
            onClick={() => onNavigate(AppSection.HISTORY)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSection === AppSection.HISTORY ? "bg-indigo-700 shadow-inner" : "hover:bg-indigo-700/50"}`}
          >
            <span className="text-xl">📋</span> रेकॉर्ड्स
          </button>
          <button
            onClick={() => onNavigate(AppSection.CHAT)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSection === AppSection.CHAT ? "bg-indigo-700 shadow-inner" : "hover:bg-indigo-700/50"}`}
          >
            <span className="text-xl">💬</span> चॅट सहाय्य
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-indigo-700 text-xs text-indigo-200">
          <p>© २०२४ गुरुजी AI - प्रगत शिक्षण</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 relative pb-20 md:pb-0">
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 flex justify-between items-center md:hidden shadow-sm">
          <h1 className="text-xl font-bold text-indigo-800">गुरुजी AI</h1>
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-bold">
            G
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-20 overflow-x-auto shadow-2xl">
        <button
          onClick={() => onNavigate(AppSection.DASHBOARD)}
          className={`flex flex-col items-center gap-1 min-w-[60px] ${activeSection === AppSection.DASHBOARD ? "text-indigo-600" : "text-slate-400"}`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">मुख्य</span>
        </button>
        <button
          onClick={() => onNavigate(AppSection.STUDENTS)}
          className={`flex flex-col items-center gap-1 min-w-[60px] ${activeSection === AppSection.STUDENTS ? "text-indigo-600" : "text-slate-400"}`}
        >
          <span className="text-xl">👥</span>
          <span className="text-[10px]">विद्यार्थी</span>
        </button>
        <button
          onClick={() => onNavigate(AppSection.ATTENDANCE)}
          className={`flex flex-col items-center gap-1 min-w-[60px] ${activeSection === AppSection.ATTENDANCE ? "text-indigo-600" : "text-slate-400"}`}
        >
          <span className="text-xl">📅</span>
          <span className="text-[10px]">हजेरी</span>
        </button>
        <button
          onClick={() => onNavigate(AppSection.HOMEWORK)}
          className={`flex flex-col items-center gap-1 min-w-[60px] ${activeSection === AppSection.HOMEWORK ? "text-indigo-600" : "text-slate-400"}`}
        >
          <span className="text-xl">✏️</span>
          <span className="text-[10px]">गृहपाठ</span>
        </button>
        <button
          onClick={() => onNavigate(AppSection.SCAN)}
          className={`flex flex-col items-center gap-1 min-w-[60px] ${activeSection === AppSection.SCAN ? "text-indigo-600" : "text-slate-400"}`}
        >
          <span className="text-xl">📷</span>
          <span className="text-[10px]">स्कॅन</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
