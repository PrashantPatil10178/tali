import React, { useState } from "react";
import { StudentProfileData } from "@tali/types";

interface AttendanceTrackerProps {
  students: StudentProfileData[];
  onSave: (records: { name: string; status: "present" | "absent" }[]) => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  students,
  onSave,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<
    Record<string, "present" | "absent">
  >(Object.fromEntries(students.map((s) => [s.name, "present"])));

  const toggleStatus = (name: string) => {
    setAttendance((prev) => ({
      ...prev,
      [name]: prev[name] === "present" ? "absent" : "present",
    }));
  };

  const handleSave = () => {
    const records = Object.entries(attendance).map(([name, status]) => ({
      name,
      status,
    }));
    onSave(records);
    alert("आजची हजेरी यशस्वीरित्या नोंदवली गेली आहे!");
  };

  const stats = {
    present: Object.values(attendance).filter((s) => s === "present").length,
    absent: Object.values(attendance).filter((s) => s === "absent").length,
    total: students.length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            दैनिक हजेरी (Attendance)
          </h2>
          <p className="text-slate-500 text-sm">आजची हजेरी नोंदवा</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700"
          />
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            हजेरी जतन करा
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center justify-between">
          <div>
            <p className="text-green-600 text-[10px] font-black uppercase tracking-widest">
              हजर विद्यार्थी
            </p>
            <p className="text-3xl font-black text-green-700">
              {stats.present}
            </p>
          </div>
          <span className="text-4xl">✅</span>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">
              गैरहजर विद्यार्थी
            </p>
            <p className="text-3xl font-black text-red-700">{stats.absent}</p>
          </div>
          <span className="text-4xl">❌</span>
        </div>
        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              एकूण विद्यार्थी
            </p>
            <p className="text-3xl font-black text-indigo-700">{stats.total}</p>
          </div>
          <span className="text-4xl">👥</span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">विद्यार्थी</th>
                <th className="px-8 py-4">वर्ग</th>
                <th className="px-8 py-4 text-center">स्थिती (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-slate-500 text-sm">१० वी अ</td>
                  <td className="px-8 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleStatus(student.name)}
                        className={`w-32 py-2 rounded-xl font-black text-xs transition-all shadow-sm ${
                          attendance[student.name] === "present"
                            ? "bg-green-500 text-white shadow-green-100"
                            : "bg-red-500 text-white shadow-red-100"
                        }`}
                      >
                        {attendance[student.name] === "present"
                          ? "हजर (Present)"
                          : "गैरहजर (Absent)"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
