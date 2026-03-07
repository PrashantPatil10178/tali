import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { StudentProfileData, StudentNote, GradingResult } from "@tali/types";

interface StudentProfileProps {
  student: StudentProfileData;
  onBack: () => void;
  onAddNote: (name: string, noteText: string) => void;
  onDeleteNote: (name: string, noteId: string) => void;
}

const COLORS = [
  "#4f46e5",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
];

const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  onBack,
  onAddNote,
  onDeleteNote,
}) => {
  const [newNote, setNewNote] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prepare data for the Line Chart (Trends)
  const trendData = useMemo(() => {
    return student.results
      .map((r) => ({
        date: new Date(r.date).toLocaleDateString("mr-IN", {
          day: "numeric",
          month: "short",
        }),
        fullDate: new Date(r.date).toLocaleDateString("mr-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        score: Math.round((r.score / r.totalMarks) * 100),
        subject: r.subject,
      }))
      .reverse();
  }, [student.results]);

  // Prepare data for the Bar Chart (Subject Breakdown)
  const subjectData = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    student.results.forEach((r) => {
      const percentage = (r.score / r.totalMarks) * 100;
      const current = map.get(r.subject) || { total: 0, count: 0 };
      map.set(r.subject, {
        total: current.total + percentage,
        count: current.count + 1,
      });
    });

    return Array.from(map.entries()).map(([subject, stats]) => ({
      subject,
      average: Math.round(stats.total / stats.count),
    }));
  }, [student.results]);

  const attendanceStats = useMemo(() => {
    const total = student.attendance?.length || 0;
    const present =
      student.attendance?.filter((a) => a.status === "present").length || 0;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    return { total, present, absent: total - present, percentage };
  }, [student.attendance]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(student.name, newNote.trim());
      setNewNote("");
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
          <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">
            {data.fullDate || data.subject}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
            <p className="text-sm font-bold text-slate-800">
              {data.subject ? `${data.subject}: ` : ""}
              {payload[0].value}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-600 active:scale-90"
          aria-label="परत जा"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
          <p className="text-slate-500 text-sm">विद्यार्थी शैक्षणिक विश्लेषण</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats and Notes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Summary Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-100">
                {student.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center text-white">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800">{student.name}</h3>
            <p className="text-slate-500 text-sm mb-4">
              आयडी: #S-{student.name.substring(0, 3).toUpperCase()}
            </p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  सरासरी
                </p>
                <p className="text-xl font-black text-indigo-600">
                  {student.averageScore.toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  चाचण्या
                </p>
                <p className="text-xl font-black text-amber-500">
                  {student.testCount}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Stat Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-indigo-600">📅</span> हजेरी स्थिती
              (Attendance)
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-600"
                    strokeWidth="3"
                    strokeDasharray={`${attendanceStats.percentage}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text
                    x="18"
                    y="20.35"
                    className="text-[8px] font-black"
                    textAnchor="middle"
                    fill="#4f46e5"
                  >
                    {attendanceStats.percentage.toFixed(0)}%
                  </text>
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">हजर दिवस:</span>
                  <span className="font-bold text-green-600">
                    {attendanceStats.present}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">गैरहजर दिवस:</span>
                  <span className="font-bold text-red-600">
                    {attendanceStats.absent}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Notes Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full max-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-indigo-600">📝</span> शिक्षक नोट्स
            </h3>

            <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
              {student.notes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                  <p className="text-sm italic">कोणतीही नोट नाही.</p>
                </div>
              ) : (
                student.notes.map((note) => (
                  <div
                    key={note.id}
                    className="group bg-indigo-50/50 p-4 rounded-2xl relative border border-indigo-50/50 hover:border-indigo-100 transition-all"
                  >
                    <button
                      onClick={() => onDeleteNote(student.name, note.id)}
                      className="absolute top-3 right-3 text-slate-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {note.text}
                    </p>
                    <p className="text-[10px] text-indigo-400 mt-2 font-bold uppercase tracking-widest">
                      {new Date(note.date).toLocaleDateString("mr-IN")}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="नोट लिहा..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 shadow-md disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[350px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-800">
                  📈 प्रगती कल (Trend)
                </h3>
              </div>
              <div className="h-64 w-full">
                {isMounted ? (
                  <ResponsiveContainer width="99%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#4f46e5"
                        strokeWidth={4}
                        dot={{
                          r: 5,
                          fill: "#4f46e5",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-3xl bg-slate-50 shimmer" />
                )}
              </div>
            </div>

            {/* Subject-wise Bar Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[350px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-800">
                  📊 विषयनिहाय सरासरी
                </h3>
              </div>
              <div className="h-64 w-full">
                {isMounted ? (
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={subjectData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="subject"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="average" radius={[6, 6, 0, 0]} barSize={32}>
                        {subjectData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-3xl bg-slate-50 shimmer" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                निकालांचा इतिहास
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 font-black">विषय</th>
                    <th className="px-6 py-4 font-black">गुण</th>
                    <th className="px-6 py-4 font-black">टक्केवारी</th>
                    <th className="px-6 py-4 font-black">दिनांक</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.results.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-400 italic"
                      >
                        कोणताही रेकॉर्ड नाही.
                      </td>
                    </tr>
                  ) : (
                    student.results.map((item, idx) => {
                      const percentage = (item.score / item.totalMarks) * 100;
                      const isPass = percentage >= 35;
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {item.subject}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-900 font-medium">
                              {item.score}
                            </span>
                            <span className="text-slate-400 text-xs">
                              / {item.totalMarks}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {percentage.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {new Date(item.date).toLocaleDateString("mr-IN")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
