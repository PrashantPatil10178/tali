import React from "react";
import { GradingResult } from "@tali/types";

export interface TaliReportPdfTemplateProps {
  result: GradingResult;
  locale?: "en" | "mr";
}

export const TaliReportPdfTemplate = React.forwardRef<
  HTMLDivElement,
  TaliReportPdfTemplateProps
>(({ result, locale = "en" }, ref) => {
  // English defaults
  let labels = {
    reportCard: "Assessment Report",
    studentName: "Student Name",
    subject: "Subject",
    date: "Date",
    overallScore: "Score",
    totalMarks: "Maximum Marks",
    performance: "Performance Summary",
    feedback: "Teacher Feedback",
    question: "Q",
    correct: "Correct",
    incorrect: "Incorrect",
    partial: "Partial",
    studentAnswer: "Student Answer",
    expectedAnswer: "Expected Answer",
    reasoning: "Reasoning",
    weakAreas: "Areas for Improvement",
  };

  if (locale === "mr") {
    labels = {
      reportCard: "मूल्यांकन अहवाल",
      studentName: "विद्यार्थ्याचे नाव",
      subject: "विषय",
      date: "दिनांक",
      overallScore: "गुण",
      totalMarks: "एकूण गुण",
      performance: "कामगिरी सारांश",
      feedback: "शिक्षकांचा अभिप्राय",
      question: "प्रश्न",
      correct: "बरोबर",
      incorrect: "चूक",
      partial: "अंशतः",
      studentAnswer: "विद्यार्थ्याचे उत्तर",
      expectedAnswer: "अपेक्षित उत्तर",
      reasoning: "स्पष्टीकरण",
      weakAreas: "सुधारणा आवश्यक क्षेत्रे",
    };
  }

  const percent =
    result.totalMarks > 0
      ? Math.round((result.score / result.totalMarks) * 100)
      : 0;

  let badgeColor = "bg-green-100 text-green-800 border-green-200";
  if (percent < 50) badgeColor = "bg-red-100 text-red-800 border-red-200";
  else if (percent < 75)
    badgeColor = "bg-amber-100 text-amber-800 border-amber-200";

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return d;
    }
  };

  return (
    <div
      ref={ref}
      className="bg-white text-slate-900 mx-auto"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        fontFamily: "'Inter', sans-serif",
        boxSizing: "border-box",
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-indigo-500 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-indigo-900 tracking-tight">
            TALI
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">
            {labels.reportCard}
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-800">
            {result.studentName || "N/A"}
          </h2>
          <div className="text-sm text-slate-500 mt-1 flex gap-3 justify-end">
            <span>
              {labels.subject}:{" "}
              <strong className="text-slate-700">{result.subject}</strong>
            </span>
            <span>•</span>
            <span>
              {labels.date}:{" "}
              <strong className="text-slate-700">
                {formatDate(result.date)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* High-level Score Overview */}
      <div className="flex gap-6 mb-8">
        <div className="bg-indigo-50 rounded-xl p-6 flex-1 border border-indigo-100">
          <p className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-1">
            {labels.overallScore}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-indigo-600">
              {result.score}
            </span>
            <span className="text-xl font-bold text-indigo-400">
              / {result.totalMarks}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 flex-1 border border-slate-100 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">
              {labels.performance}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}
            >
              {percent}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      {result.feedback && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            {labels.feedback}
          </h3>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
            {result.feedback}
          </div>
        </div>
      )}

      {/* Weak Areas */}
      {result.weakAreas && result.weakAreas.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider mb-3">
            {labels.weakAreas}
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.weakAreas.map((area, idx) => (
              <span
                key={idx}
                className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-md text-sm font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Corrections Breakdown */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">
          Detailed Analysis
        </h3>
        <div className="space-y-6">
          {result.corrections.map((q, idx) => {
            const qPercent = q.maxMarks > 0 ? q.marksObtained / q.maxMarks : 0;
            let qStatus = labels.incorrect;
            let statusColor = "text-rose-600 bg-rose-50 border-rose-200";

            if (qPercent === 1) {
              qStatus = labels.correct;
              statusColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
            } else if (qPercent > 0) {
              qStatus = labels.partial;
              statusColor = "text-amber-600 bg-amber-50 border-amber-200";
            }

            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden page-break-inside-avoid"
              >
                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                  <div className="font-bold text-slate-800">
                    {labels.question} {q.questionNo || idx + 1}
                  </div>
                  <div className="flex gap-3 items-center">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded border ${statusColor}`}
                    >
                      {qStatus}
                    </span>
                    <span className="text-sm font-bold text-slate-600">
                      {q.marksObtained} / {q.maxMarks}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                      {labels.studentAnswer}
                    </p>
                    <p className="text-slate-800 text-sm">
                      {q.studentAnswer || "-"}
                    </p>
                  </div>
                  {qPercent < 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
                      <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                        <p className="text-xs font-bold text-emerald-800 uppercase mb-1">
                          {labels.expectedAnswer}
                        </p>
                        <p className="text-slate-700 text-sm">
                          {q.correctAnswer || "-"}
                        </p>
                      </div>
                      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">
                          {labels.reasoning}
                        </p>
                        <p className="text-slate-700 text-sm">
                          {q.analysis || "-"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
TaliReportPdfTemplate.displayName = "TaliReportPdfTemplate";
