import React, { useState } from "react";
import { StudentProfileData } from "@tali/types";
import { useLanguage } from "@/lib/LanguageContext";

interface StudentsListProps {
  students: StudentProfileData[];
  onSelectStudent: (student: StudentProfileData) => void;
}

const StudentsList: React.FC<StudentsListProps> = ({
  students,
  onSelectStudent,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {t("students.title")}
          </h2>
          <p className="text-slate-500 text-sm">{t("students.subtitle")}</p>
        </div>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder={t("students.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-10 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all"
          />
          <svg
            className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 italic">{t("students.notFound")}</p>
          </div>
        ) : (
          filteredStudents.map((student, idx) => (
            <button
              key={idx}
              onClick={() => onSelectStudent(student)}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-xl group-hover:scale-105 transition-transform">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">
                    {student.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-2">
                    {t("students.class")}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                      {student.testCount} {t("students.tests")}
                    </span>
                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">
                      {student.averageScore.toFixed(0)}% {t("students.avg")}
                    </span>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentsList;
