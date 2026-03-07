import React, { useRef, useState, useEffect } from "react";
import { generateLearningPlan } from "@tali/gemini/client";
import { GradingResult, LearningPlan } from "@tali/types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ResultViewProps {
  results: GradingResult[];
  onClose: () => void;
  onScanAnother?: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({
  results: initialResults,
  onClose,
  onScanAnother,
}) => {
  const analysisRef = useRef<HTMLDivElement>(null);
  const lipRef = useRef<HTMLDivElement>(null);
  const masterReportRef = useRef<HTMLDivElement>(null);

  const [results, setResults] = useState<GradingResult[]>(initialResults);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isMasterGenerating, setIsMasterGenerating] = useState(false);
  const [masterProgress, setMasterProgress] = useState({
    current: 0,
    total: 0,
  });
  const [showSetup, setShowSetup] = useState(false);

  const [selectedResult, setSelectedResult] = useState<GradingResult | null>(
    initialResults.length === 1 ? initialResults[0] : null,
  );
  const [days, setDays] = useState(5);
  const [minutes, setMinutes] = useState(20);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);

  useEffect(() => {
    // जेव्हा सिलेक्टेड रिझल्ट बदलतो, तेव्हा स्टेट अपडेट करा
    if (selectedResult) {
      const current = results.find(
        (r) => r.studentName === selectedResult.studentName,
      );
      setLearningPlan(current?.learningPlan || null);
    }
    setShowSetup(false);
  }, [selectedResult, results]);

  const downloadPDF = async (
    ref: React.RefObject<HTMLDivElement | null>,
    filename: string,
  ) => {
    if (!ref.current) return;
    setIsGenerating(true);
    try {
      const element = ref.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(filename);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("PDF तयार करताना अडचण आली.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedResult) return;
    setIsPlanning(true);
    try {
      const plan = await generateLearningPlan(selectedResult, days, minutes);

      // अपडेटेड रिझल्टला स्टेटमध्ये सेव्ह करा जेणेकरून मास्टर रिपोर्टमध्ये तो वापरता येईल
      setResults((prev) =>
        prev.map((r) =>
          r.studentName === selectedResult.studentName
            ? { ...r, learningPlan: plan }
            : r,
        ),
      );

      setLearningPlan(plan);
      setShowSetup(false);
    } catch (error) {
      alert("नियोजन तयार करताना अडचण आली.");
    } finally {
      setIsPlanning(false);
    }
  };

  const downloadMasterReport = async () => {
    setIsMasterGenerating(true);
    setMasterProgress({ current: 0, total: results.length });

    try {
      const updatedResults = [...results];

      // १. सर्व विद्यार्थ्यांचे LIP तयार आहेत का ते तपासा, नसल्यास करा
      for (let i = 0; i < updatedResults.length; i++) {
        setMasterProgress({ current: i + 1, total: updatedResults.length });
        if (!updatedResults[i].learningPlan) {
          try {
            // डीफॉल्ट ५ दिवस आणि २० मिनिटांचा प्लान
            const plan = await generateLearningPlan(updatedResults[i], 5, 20);
            updatedResults[i].learningPlan = plan;
          } catch (err) {
            console.error(
              `LIP error for ${updatedResults[i].studentName}`,
              err,
            );
          }
        }
      }

      setResults(updatedResults);

      // २. थोडे थांबा जेणेकरून डोम (DOM) अपडेट होईल
      setTimeout(async () => {
        await downloadPDF(
          masterReportRef,
          `Master_Report_${new Date().getTime()}.pdf`,
        );
        setIsMasterGenerating(false);
      }, 1000);
    } catch (error) {
      console.error("Master Report Error:", error);
      alert("मास्टर रिपोर्ट तयार करताना त्रुटी आली.");
      setIsMasterGenerating(false);
    }
  };

  const getMarksStyle = (obtained: number, max: number) => {
    if (obtained < max) {
      return "text-red-600 bg-red-50 border-red-200 px-3 py-1 rounded-lg border font-black shadow-sm";
    }
    return "text-emerald-700 bg-emerald-50 border-emerald-200 px-3 py-1 rounded-lg border font-black shadow-sm";
  };

  // विद्यार्थी निवड स्क्रीन (Student Picker)
  if (!selectedResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-800 mb-2">
              विद्यार्थी निवडा
            </h2>
            <p className="text-slate-500">
              या फाईलमध्ये {results.length} विद्यार्थ्यांच्या उत्तरपत्रिका
              सापडल्या आहेत.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {results.map((res, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedResult(res)}
                className="bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm group-hover:scale-110 transition-transform">
                    {res.studentName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">
                      {res.studentName}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {res.subject} • {res.score}/{res.totalMarks} गुण
                    </p>
                  </div>
                </div>
                {res.learningPlan && (
                  <span className="bg-green-100 text-green-700 p-1.5 rounded-full text-[10px] font-black">
                    LIP ✅
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h4 className="font-black text-indigo-900 text-lg">
                बॅच मास्टर रिपोर्ट
              </h4>
              <p className="text-indigo-600 text-sm">
                सर्व विद्यार्थ्यांचे विश्लेषण आणि LIP एकाच PDF मध्ये मिळवा.
              </p>
            </div>
            <button
              onClick={downloadMasterReport}
              disabled={isMasterGenerating}
              className="bg-indigo-600 text-white font-black py-4 px-8 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              <span>
                {isMasterGenerating
                  ? "प्रोसेसिंग..."
                  : "मास्टर PDF डाउनलोड करा"}
              </span>
              <span className="text-xl">📄</span>
            </button>
          </div>

          <div className="mt-12 flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-10 py-3 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
            >
              परत जा
            </button>
            <button
              onClick={onScanAnother}
              className="px-10 py-3 bg-slate-800 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-900 transition-all"
            >
              दुसरी फाईल स्कॅन करा
            </button>
          </div>
        </div>

        {/* Hidden Master Report Builder (Only for PDF Generation) */}
        <div className="hidden">
          <div
            ref={masterReportRef}
            className="p-10 space-y-20 bg-white"
            style={{ width: "800px" }}
          >
            <div className="text-center border-b-4 border-indigo-900 pb-8">
              <h1 className="text-4xl font-black text-indigo-900 mb-2">
                गुरुजी AI - बॅच मास्टर रिपोर्ट
              </h1>
              <p className="text-slate-500 font-bold">
                दिनांक: {new Date().toLocaleDateString("mr-IN")} | एकूण
                विद्यार्थी: {results.length}
              </p>
            </div>
            {results.map((res, rIdx) => (
              <div
                key={rIdx}
                className="space-y-10 border-b-2 border-slate-100 pb-20 last:border-0"
              >
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">
                      {res.studentName}
                    </h2>
                    <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm">
                      {res.subject} • विश्लेषण
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-indigo-900">
                      {res.score}/{res.totalMarks}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      गुण
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-800 border-l-4 border-indigo-600 pl-4">
                    अभिप्राय
                  </h3>
                  <p className="text-slate-700 italic text-lg leading-relaxed">
                    {res.feedback}
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-800 border-l-4 border-indigo-600 pl-4">
                    प्रश्ननिहाय विश्लेषण
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {res.corrections.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="border border-slate-100 p-6 rounded-2xl bg-white shadow-sm"
                      >
                        <div className="flex justify-between mb-3">
                          <span className="font-black text-slate-400">
                            प्र. {c.questionNo}
                          </span>
                          <span
                            className={getMarksStyle(
                              c.marksObtained,
                              c.maxMarks,
                            )}
                          >
                            {c.marksObtained}/{c.maxMarks}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 mb-2">
                          {c.questionText}
                        </p>
                        <p className="text-indigo-900 text-sm font-bold bg-indigo-50 p-3 rounded-xl">
                          {c.analysis}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {res.learningPlan && (
                  <div className="mt-10 pt-10 border-t-2 border-dashed border-slate-200">
                    <h3 className="text-2xl font-black text-amber-600 mb-6">
                      लर्निंग इम्प्रूव्हमेंट प्लान (LIP)
                    </h3>
                    <div className="space-y-6">
                      {res.learningPlan.activities.map((a, aIdx) => (
                        <div
                          key={aIdx}
                          className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100"
                        >
                          <h4 className="font-black text-slate-800 mb-2">
                            दिवस {a.day}: {a.title}
                          </h4>
                          <p className="text-slate-600 text-sm mb-2">
                            <span className="font-black text-slate-800">
                              साहित्य:
                            </span>{" "}
                            {a.whatIsNeeded}
                          </p>
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {a.howToDo}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Master Report Generation Overlay */}
        {isMasterGenerating && (
          <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-xl flex items-center justify-center z-[200] p-8">
            <div className="bg-white p-12 rounded-[4rem] text-center max-w-lg w-full shadow-2xl border-b-[20px] border-indigo-600">
              <div className="text-9xl mb-10 animate-pulse">📦</div>
              <h3 className="text-4xl font-black text-slate-900 mb-4">
                मास्टर रिपोर्ट तयार होत आहे
              </h3>
              <p className="text-slate-500 font-bold text-lg mb-10">
                कृपया थांबा, आम्ही प्रत्येक विद्यार्थ्याचा सविस्तर प्रगती आराखडा
                (LIP) एकत्रित करत आहोत.
              </p>

              <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden mb-4 border border-slate-200 p-1 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-black"
                  style={{
                    width: `${(masterProgress.current / masterProgress.total) * 100}%`,
                  }}
                >
                  {Math.round(
                    (masterProgress.current / masterProgress.total) * 100,
                  )}
                  %
                </div>
              </div>
              <p className="text-indigo-600 font-black tracking-widest uppercase">
                विद्यार्थी {masterProgress.current} / {masterProgress.total}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // वैयक्तिक निकाल व्ह्यू
  return (
    <div className="max-w-4xl mx-auto mb-20 animate-in fade-in duration-500 space-y-12">
      <div
        ref={analysisRef}
        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="bg-indigo-900 px-10 py-10 text-white relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <div className="bg-white p-3 rounded-[1.25rem] text-3xl shadow-xl shadow-indigo-500/20 text-indigo-900">
                👨‍🏫
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  उत्तरपत्रिका विश्लेषण अहवाल
                </h1>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-[0.2em]">
                  Guruji AI - Precision Learning
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black">
                {new Date(selectedResult.date).toLocaleDateString("mr-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 grid grid-cols-1 md:grid-cols-4 gap-8 bg-slate-50 border-b border-slate-100 items-center">
          <div className="md:col-span-3">
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              {selectedResult.studentName}
            </h2>
            <div className="flex gap-4">
              <span className="bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg">
                विषय: {selectedResult.subject}
              </span>
              <span className="bg-white border border-slate-200 px-6 py-2 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                गुण: {selectedResult.score}/{selectedResult.totalMarks}
              </span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-indigo-50 flex flex-col items-center justify-center">
            <div className="text-4xl font-black text-indigo-600">
              {Math.round(
                (selectedResult.score / selectedResult.totalMarks) * 100,
              )}
              %
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              एकूण गुणवत्ता
            </p>
          </div>
        </div>

        <div className="p-10 space-y-12">
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">
                🗣️
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                गुरुजींचा अभिप्राय
              </h3>
            </div>
            <div className="bg-indigo-50/50 p-10 rounded-[2.5rem] border-l-[10px] border-indigo-500 text-indigo-900 font-bold text-xl leading-relaxed italic shadow-inner">
              {selectedResult.feedback}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">
                📝
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                सविस्तर प्रश्ननिहाय विश्लेषण
              </h3>
            </div>
            <div className="space-y-6">
              {selectedResult.corrections.map((corr, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="bg-slate-50 px-8 py-4 flex justify-between items-center border-b border-slate-100">
                    <span className="font-black text-slate-400 text-xs uppercase tracking-widest">
                      प्रश्न क्रमांक {corr.questionNo}
                    </span>
                    <div
                      className={getMarksStyle(
                        corr.marksObtained,
                        corr.maxMarks,
                      )}
                    >
                      {corr.marksObtained} / {corr.maxMarks} गुण
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <p className="font-black text-slate-800 text-xl leading-tight group-hover:text-indigo-600 transition-colors">
                      {corr.questionText}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                          विद्यार्थ्याचे उत्तर
                        </p>
                        <p
                          className={`p-4 rounded-xl border italic ${corr.marksObtained < corr.maxMarks ? "bg-red-50/30 border-red-100 text-red-900" : "bg-slate-50 border-slate-100 text-slate-600"}`}
                        >
                          {corr.studentAnswer || "---"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">
                          अपेक्षित आदर्श उत्तर
                        </p>
                        <p className="text-emerald-800 bg-emerald-50 p-4 rounded-xl border border-emerald-100 font-bold">
                          {corr.correctAnswer}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`p-5 rounded-2xl border flex gap-4 items-center ${corr.marksObtained < corr.maxMarks ? "bg-red-50 border-red-100" : "bg-indigo-50 border-indigo-50"}`}
                    >
                      <span className="text-2xl">
                        {corr.marksObtained < corr.maxMarks ? "⚠️" : "💡"}
                      </span>
                      <p
                        className={`text-base font-bold leading-relaxed ${corr.marksObtained < corr.maxMarks ? "text-red-900" : "text-indigo-900"}`}
                      >
                        {corr.analysis}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="no-pdf flex justify-center">
        <button
          onClick={() =>
            downloadPDF(
              analysisRef,
              `Analysis_${selectedResult.studentName}.pdf`,
            )
          }
          className="bg-indigo-600 text-white font-black py-4 px-12 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 text-lg"
        >
          <span>विश्लेषण अहवाल PDF</span> <span className="text-xl">📥</span>
        </button>
      </div>

      <section
        id="lip-section"
        className="bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-10 opacity-60"></div>
        <div className="flex items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-amber-500 text-white rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-amber-100">
            🚀
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">
              लर्निंग इम्प्रूव्हमेंट प्लान (LIP)
            </h3>
            <p className="text-amber-600 text-sm font-black uppercase tracking-widest">
              आनंददायी आणि कृतियुक्त प्रगती आराखडा
            </p>
          </div>
        </div>

        {!learningPlan && !showSetup && (
          <div className="text-center py-16 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 no-pdf">
            <div className="text-6xl mb-6">🎯</div>
            <p className="text-slate-500 font-bold text-lg mb-8 max-w-md mx-auto">
              विद्यार्थ्याच्या कच्च्या दुव्यांवर मात करण्यासाठी सविस्तर आराखडा
              तयार करूया.
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="bg-amber-500 text-white font-black py-5 px-16 rounded-[2rem] shadow-2xl hover:bg-amber-600 transition-all text-2xl"
            >
              LIP प्लॅन तयार करा ✨
            </button>
          </div>
        )}

        {showSetup && (
          <div className="space-y-10 animate-in slide-in-from-bottom-6 no-pdf">
            <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-indigo-100 shadow-inner">
              <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm">
                  📍
                </span>{" "}
                कच्चे दुवे:
              </h4>
              <div className="flex flex-wrap gap-3 mb-8">
                {selectedResult.weakAreas.map((area: string, i: number) => (
                  <span
                    key={i}
                    className="bg-red-50 text-red-700 border border-red-200 px-5 py-2.5 rounded-2xl text-sm font-black shadow-sm"
                  >
                    #{area}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <label className="text-xl font-black text-slate-700 flex justify-between">
                  <span>किती दिवस?</span>
                  <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-xl">
                    {days} दिवस
                  </span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="w-full h-3 bg-indigo-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <label className="text-xl font-black text-slate-700 flex justify-between">
                  <span>वेळ (मि.)</span>
                  <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-xl">
                    {minutes} मि.
                  </span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="5"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value))}
                  className="w-full h-3 bg-amber-100 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-center pt-4">
              <button
                onClick={handleGeneratePlan}
                disabled={isPlanning}
                className="bg-indigo-600 text-white font-black py-6 px-20 rounded-[2.5rem] shadow-2xl hover:bg-indigo-700 transition-all text-2xl flex items-center gap-4 disabled:opacity-50"
              >
                {isPlanning ? "तयार होत आहे..." : "आराखडा तयार करा 🎯"}
              </button>
            </div>
          </div>
        )}

        {learningPlan && (
          <div
            ref={lipRef}
            className="space-y-12 animate-in fade-in zoom-in-95"
          >
            <div className="bg-indigo-50/50 p-10 rounded-[3rem] border-2 border-indigo-100 flex flex-col md:flex-row justify-between items-center gap-8 shadow-inner">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                  विद्यार्थ्याचे नाव
                </p>
                <h4 className="text-3xl font-black text-indigo-900">
                  {selectedResult.studentName}
                </h4>
              </div>
              <div className="flex gap-6">
                <div className="bg-white px-8 py-3 rounded-2xl shadow-sm border border-indigo-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    एकूण दिवस
                  </p>
                  <p className="font-black text-indigo-600 text-xl">
                    {learningPlan.timeline}
                  </p>
                </div>
                <div className="bg-white px-8 py-3 rounded-2xl shadow-sm border border-indigo-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    वेळ/दिवस
                  </p>
                  <p className="font-black text-amber-500 text-xl">
                    {learningPlan.dailyTime}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-12">
              {learningPlan.activities.map((act, i) => (
                <div
                  key={i}
                  className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden group hover:border-amber-400 transition-all border-b-8 border-b-slate-50"
                >
                  <div className="absolute top-0 left-0 w-3 h-full bg-amber-500 group-hover:w-4 transition-all"></div>
                  <div className="flex justify-between items-center mb-10">
                    <h4 className="font-black text-slate-800 text-2xl flex items-center gap-5">
                      <span className="px-6 py-2 bg-amber-500 text-white rounded-2xl text-sm font-black shadow-lg">
                        दिवस {act.day}
                      </span>
                      {act.title}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl">
                          📦
                        </div>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                          साहित्य
                        </p>
                      </div>
                      <div className="text-slate-700 font-bold text-lg leading-relaxed bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                        {act.whatIsNeeded}
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
                          🛠️
                        </div>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                          कृती
                        </p>
                      </div>
                      <div className="text-slate-700 font-bold text-lg leading-relaxed bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner whitespace-pre-wrap">
                        {act.howToDo}
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] flex flex-col md:flex-row gap-6 shadow-2xl relative">
                    <div className="text-5xl mt-1 shrink-0">💡</div>
                    <div>
                      <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-3">
                        शिक्षक मार्गदर्शक सूचना
                      </p>
                      <p className="text-indigo-50 text-lg font-bold leading-relaxed">
                        {act.guidelines}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="no-pdf flex justify-center pb-12">
        <button
          onClick={() =>
            downloadPDF(lipRef, `LIP_${selectedResult.studentName}.pdf`)
          }
          className="bg-amber-600 text-white font-black py-6 px-16 rounded-[2.5rem] shadow-2xl hover:bg-amber-700 transition-all flex items-center justify-center gap-5 text-2xl active:scale-95"
        >
          <span>LIP प्लॅन PDF</span> <span className="text-4xl">📥</span>
        </button>
      </div>

      <div className="flex justify-center gap-6 no-print pt-6 no-pdf">
        <button
          onClick={() => {
            if (initialResults.length > 1) {
              setSelectedResult(null);
            } else {
              onClose();
            }
          }}
          className="px-14 bg-white border-4 border-slate-200 text-slate-500 font-black py-5 rounded-[2rem] hover:bg-slate-50 transition-all text-xl active:scale-95"
        >
          {initialResults.length > 1 ? "यादीवर जा 🔙" : "परत जा 🔙"}
        </button>
      </div>

      {(isPlanning || isGenerating) && (
        <div className="fixed inset-0 bg-indigo-900/80 backdrop-blur-2xl flex items-center justify-center z-[150] p-8 no-pdf">
          <div className="bg-white p-16 rounded-[5rem] text-center max-w-lg w-full shadow-2xl border-b-[16px] border-amber-500">
            <div className="flex justify-center mb-10">
              <span className="text-9xl animate-bounce">🎨</span>
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-6">
              {isPlanning ? "आराखडा तयार होत आहे..." : "PDF तयार होत आहे..."}
            </h3>
            <div className="flex gap-5 justify-center mt-8">
              <div className="w-5 h-5 bg-amber-500 rounded-full animate-bounce"></div>
              <div className="w-5 h-5 bg-amber-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-5 h-5 bg-amber-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
