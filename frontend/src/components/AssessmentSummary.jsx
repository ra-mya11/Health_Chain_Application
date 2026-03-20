import React, { useState, useEffect } from "react";
import api from "../services/api";

function AssessmentSummary() {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessment();
  }, []);

  const fetchAssessment = async () => {
    const uid = (() => { try { return JSON.parse(localStorage.getItem("user"))?.userId || "guest"; } catch { return "guest"; } })();

    // First check sessionStorage — scoped to this user
    const stored = sessionStorage.getItem(`lastAssessment_${uid}`);
    if (stored) {
      try {
        setAssessment(JSON.parse(stored));
        setLoading(false);
        return;
      } catch {}
    }

    // Fallback to backend
    try {
      const res = await api.get("/assessments/latest");
      if (res.data) {
        const d = res.data;
        setAssessment({
          Age: d.age,
          BMI: d.bmi,
          BloodPressure: d.bloodPressure,
          Cholesterol: d.cholesterol,
          Glucose: d.glucose,
          risk_level: d.riskLevel,
          timestamp: d.timestamp,
          source: d.source,
        });
      }
    } catch {}

    setLoading(false);
  };

  const getRiskColor = (level) => {
    if (!level) return "text-gray-600 bg-gray-100";
    const l = level.toLowerCase();
    if (l === "high") return "text-red-600 bg-red-100 border-red-300";
    if (l === "medium") return "text-yellow-600 bg-yellow-100 border-yellow-300";
    return "text-green-600 bg-green-100 border-green-300";
  };

  if (loading) return <div className="text-center py-12">Loading assessment...</div>;

  if (!assessment) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-600 text-lg">No assessment found</p>
        <p className="text-sm text-gray-500 mt-2">
          Complete the AI Symptom Checker or Risk Assessment in the Dashboard tab first.
        </p>
      </div>
    );
  }

  const isSymptomChecker = assessment.source === "symptom_checker" || assessment.predicted_disease;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">📊 Assessment Summary</h2>

      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Latest Health Assessment</h3>
            <p className="text-sm text-gray-500 mt-1">
              Source: {isSymptomChecker ? "🤖 AI Symptom Checker" : "💊 Risk Assessment"}
            </p>
          </div>
          {assessment.timestamp && (
            <span className="text-sm text-gray-500">
              {new Date(assessment.timestamp).toLocaleString()}
            </span>
          )}
        </div>

        {/* Risk Level — always show */}
        {assessment.risk_level && (
          <div className={`p-5 rounded-xl border-2 text-center ${getRiskColor(assessment.risk_level)}`}>
            <p className="text-sm font-medium uppercase tracking-wide">Overall Risk Level</p>
            <p className="text-4xl font-bold mt-1">{assessment.risk_level}</p>
          </div>
        )}

        {/* Symptom Checker Results */}
        {isSymptomChecker && (
          <div className="space-y-4">
            {assessment.predicted_disease && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">Predicted Condition</p>
                <p className="text-xl font-bold text-indigo-700">{assessment.predicted_disease}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {assessment.confidence && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="text-xl font-bold">{assessment.confidence}%</p>
                </div>
              )}
              {assessment.recommended_department && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Recommended Department</p>
                  <p className="text-lg font-bold text-purple-700">{assessment.recommended_department}</p>
                </div>
              )}
              {assessment.age && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="text-xl font-bold">{assessment.age} years</p>
                </div>
              )}
            </div>

            {/* Contributing Symptoms */}
            {assessment.symptoms && Object.keys(assessment.symptoms).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-3">Contributing Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(assessment.symptoms).map(([symptom, value]) => (
                    <span
                      key={symptom}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        value >= 2 ? "bg-red-100 text-red-700"
                        : value >= 1 ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {symptom.replace(/_/g, " ")} ({value >= 2 ? "Severe" : value >= 1 ? "Mild" : "None"})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Risk Assessment Vitals */}
        {!isSymptomChecker && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Age", value: assessment.Age, unit: "years", bg: "bg-gray-50" },
              { label: "BMI", value: assessment.BMI, unit: "", bg: "bg-blue-50" },
              { label: "Blood Pressure", value: assessment.BloodPressure, unit: "mmHg", bg: "bg-red-50" },
              { label: "Cholesterol", value: assessment.Cholesterol, unit: "mg/dL", bg: "bg-yellow-50" },
              { label: "Glucose", value: assessment.Glucose, unit: "mg/dL", bg: "bg-green-50" },
            ].map(({ label, value, unit, bg }) =>
              value != null ? (
                <div key={label} className={`${bg} p-4 rounded-lg`}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold">{value} {unit}</p>
                </div>
              ) : null
            )}
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a preliminary assessment. Please consult a healthcare professional for proper diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AssessmentSummary;
