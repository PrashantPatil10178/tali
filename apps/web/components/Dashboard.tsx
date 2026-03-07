import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GradingResult } from "@tali/types";

interface DashboardProps {
  history: GradingResult[];
}

const data = [
  { name: "सोम", count: 12 },
  { name: "मंगळ", count: 18 },
  { name: "बुध", count: 25 },
  { name: "गुरु", count: 21 },
  { name: "शुक्र", count: 32 },
  { name: "शनी", count: 15 },
  { name: "रवी", count: 5 },
];

const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Introduction Hero Section */}
      <div className="bg-gradient-to-r from-indigo-700 to-violet-800 rounded-[3rem] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-10 items-center">
        <div className="relative z-10 flex-1">
          <div className="bg-white/20 backdrop-blur-md w-fit px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-8 border border-white/20">
            नमस्ते, मी गुरुजी AI सहाय्यक
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight tracking-tight">
            उत्तरपत्रिका तपासणी आता झाली सोपी!
          </h2>
          <p className="text-indigo-100 text-lg md:text-2xl leading-relaxed font-medium mb-10 max-w-2xl opacity-90">
            जेमिनीच्या मदतीने बनवलेला तुमचा वैयक्तिक शैक्षणिक मॅनेजर. मी
            प्रश्नपत्रिका तपासू शकतो, गृहपाठ तयार करू शकतो आणि प्रत्येक
            विद्यार्थ्यासाठी खास प्रगती आराखडा बनवू शकतो.
          </p>
          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-2xl">📝</span>
              <span className="text-base font-bold">अचूक तपासणी</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-2xl">✍️</span>
              <span className="text-base font-bold">गृहपाठ निर्माता</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-white/10 p-10 rounded-[3rem] backdrop-blur-sm border border-white/20 shadow-2xl flex items-center justify-center">
          <span className="text-9xl filter drop-shadow-2xl">👨‍🏫</span>
        </div>

        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
            एकूण तपासण्या
          </p>
          <h3 className="text-4xl font-black text-indigo-600 group-hover:scale-105 transition-transform">
            {history.length + 128}
          </h3>
          <p className="text-xs text-green-500 mt-3 font-bold flex items-center gap-1">
            <span className="text-lg">📈</span> १२% वाढ
          </p>
        </div>
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
            सरासरी गुणवत्ता
          </p>
          <h3 className="text-4xl font-black text-slate-800 group-hover:scale-105 transition-transform">
            ७८%
          </h3>
          <p className="text-xs text-slate-400 mt-3 font-bold">
            इयत्ता १० वी 'अ'
          </p>
        </div>
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
            वेळेची बचत
          </p>
          <h3 className="text-4xl font-black text-amber-500 group-hover:scale-105 transition-transform">
            ४५ ता.
          </h3>
          <p className="text-xs text-slate-400 mt-3 font-bold">
            AI मुळे झालेली बचत
          </p>
        </div>
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
            सक्रिय कोर्सेस
          </p>
          <h3 className="text-4xl font-black text-slate-800 group-hover:scale-105 transition-transform">
            ०६
          </h3>
          <p className="text-xs text-indigo-400 mt-3 font-bold">
            मराठी, गणित, विज्ञान...
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <span className="w-10 h-10 bg-indigo-50 flex items-center justify-center rounded-xl text-indigo-600">
            📊
          </span>
          साप्ताहिक प्रगती अहवाल
        </h3>
        <div className="h-72 w-full">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: "bold" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: "bold" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "24px",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    padding: "16px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#4f46e5"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  strokeWidth={4}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-3xl bg-slate-50 shimmer" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
