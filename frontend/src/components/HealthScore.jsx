import React, { useState, useEffect } from "react";
import api from "../services/api";

function HealthScore() {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessment();
  }, []);

  const fetchAssessment = async () => {
    const uid = (() => { try { return JSON.parse(localStorage.getItem("user"))?.userId || "guest"; } catch { return "guest"; } })();

    // Check sessionStorage scoped to this user
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
          source: d.source,
          timestamp: d.timestamp,
        });
      }
    } catch {}
    setLoading(false);
  };

  // Calculate score from Risk Assessment vitals
  const calculateVitalScore = (a) => {
    let score = 100;
    if (a.Glucose > 126) score -= 25;
    else if (a.Glucose > 100) score -= 10;
    if (a.BloodPressure > 140) score -= 25;
    else if (a.BloodPressure > 120) score -= 10;
    if (a.Cholesterol > 240) score -= 20;
    else if (a.Cholesterol > 200) score -= 10;
    if (a.BMI > 30) score -= 15;
    else if (a.BMI > 25) score -= 5;
    return Math.max(0, score);
  };

  // Calculate score from Symptom Checker risk level
  const calculateRiskScore = (riskLevel) => {
    if (!riskLevel) return 70;
    const l = riskLevel.toLowerCase();
    if (l === "high") return 35;
    if (l === "medium") return 60;
    return 85;
  };

  const getScore = () => {
    if (!assessment) return 70;
    const isSymptomChecker = assessment.source === "symptom_checker" || assessment.predicted_disease;
    if (isSymptomChecker) return calculateRiskScore(assessment.risk_level);
    const hasVitals = assessment.Glucose || assessment.BloodPressure || assessment.Cholesterol || assessment.BMI;
    if (hasVitals) return calculateVitalScore(assessment);
    return calculateRiskScore(assessment.risk_level);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const getBarColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) return <div className="text-center py-12">Loading health score...</div>;

  const score = getScore();
  const isSymptomChecker = assessment && (assessment.source === "symptom_checker" || assessment.predicted_disease);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">💚 Health Score</h2>

      {/* Score Card */}
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className={`text-8xl font-bold mb-2 ${getScoreColor(score)}`}>{score}</div>
        <div className={`text-2xl font-semibold mb-1 ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
        <p className="text-gray-500 text-sm mb-2">out of 100</p>
        {assessment && (
          <p className="text-xs text-gray-400 mb-4">
            Based on: {isSymptomChecker ? "🤖 AI Symptom Checker" : "💊 Risk Assessment"}
            {assessment.timestamp && ` • ${new Date(assessment.timestamp).toLocaleString()}`}
          </p>
        )}

        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-700 ${getBarColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 - Poor</span>
          <span>40 - Fair</span>
          <span>60 - Good</span>
          <span>80 - Excellent</span>
        </div>
      </div>

      {/* Risk Level from Symptom Checker */}
      {isSymptomChecker && assessment && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assessment.risk_level && (
            <div className={`p-4 rounded-lg text-center border-2 ${
              assessment.risk_level.toLowerCase() === "high" ? "bg-red-50 border-red-300 text-red-700"
              : assessment.risk_level.toLowerCase() === "medium" ? "bg-yellow-50 border-yellow-300 text-yellow-700"
              : "bg-green-50 border-green-300 text-green-700"
            }`}>
              <p className="text-xs font-medium uppercase">Risk Level</p>
              <p className="text-2xl font-bold mt-1">{assessment.risk_level}</p>
            </div>
          )}
          {assessment.predicted_disease && (
            <div className="bg-indigo-50 p-4 rounded-lg text-center border-2 border-indigo-200">
              <p className="text-xs font-medium uppercase text-indigo-600">Predicted Condition</p>
              <p className="text-lg font-bold text-indigo-700 mt-1">{assessment.predicted_disease}</p>
            </div>
          )}
          {assessment.recommended_department && (
            <div className="bg-purple-50 p-4 rounded-lg text-center border-2 border-purple-200">
              <p className="text-xs font-medium uppercase text-purple-600">Recommended Dept</p>
              <p className="text-lg font-bold text-purple-700 mt-1">{assessment.recommended_department}</p>
            </div>
          )}
        </div>
      )}

      {/* Vitals from Risk Assessment */}
      {!isSymptomChecker && assessment && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Glucose", value: assessment.Glucose, unit: "mg/dL", normal: assessment.Glucose <= 100, bg: "bg-green-50" },
            { label: "Blood Pressure", value: assessment.BloodPressure, unit: "mmHg", normal: assessment.BloodPressure <= 120, bg: "bg-blue-50" },
            { label: "Cholesterol", value: assessment.Cholesterol, unit: "mg/dL", normal: assessment.Cholesterol <= 200, bg: "bg-yellow-50" },
            { label: "BMI", value: assessment.BMI, unit: "", normal: assessment.BMI <= 25, bg: "bg-purple-50" },
          ].map(({ label, value, unit, normal, bg }) => value != null && (
            <div key={label} className={`${bg} p-4 rounded-lg`}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold">{value} {unit}</p>
              <p className={`text-xs mt-1 font-medium ${normal ? "text-green-600" : "text-red-600"}`}>
                {normal ? "✓ Normal" : "⚠ High"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* No data */}
      {!assessment && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600">No assessment data available.</p>
          <p className="text-sm text-gray-500 mt-2">
            Complete the AI Symptom Checker or Risk Assessment in the Dashboard tab.
          </p>
        </div>
      )}

      {/* Score Guide */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-700 mb-4">📊 Score Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { range: "80-100", label: "Excellent", color: "bg-green-100 text-green-700" },
            { range: "60-79", label: "Good", color: "bg-yellow-100 text-yellow-700" },
            { range: "40-59", label: "Fair", color: "bg-orange-100 text-orange-700" },
            { range: "0-39", label: "Poor", color: "bg-red-100 text-red-700" },
          ].map(({ range, label, color }) => (
            <div key={range} className={`${color} p-3 rounded-lg text-center`}>
              <p className="font-bold">{range}</p>
              <p className="text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HealthScore;
