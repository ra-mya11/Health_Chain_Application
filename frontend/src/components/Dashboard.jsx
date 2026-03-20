import React, { useState } from "react";
import SymptomChecker from "./SymptomChecker";
import api from "../services/api";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("symptom-checker");
  const [formData, setFormData] = useState({
    Age: "", BMI: "", BloodPressure: "", Cholesterol: "", Glucose: "", Sex: "0",
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateLocalRisk = (data) => {
    let score = 0;
    if (data.Glucose > 126) score += 3;
    else if (data.Glucose > 100) score += 1;
    if (data.BloodPressure > 140) score += 3;
    else if (data.BloodPressure > 120) score += 1;
    if (data.Cholesterol > 240) score += 3;
    else if (data.Cholesterol > 200) score += 1;
    if (data.BMI > 30) score += 2;
    else if (data.BMI > 25) score += 1;
    if (data.Age > 60) score += 2;
    else if (data.Age > 45) score += 1;
    const risk_level = score >= 6 ? "High" : score >= 3 ? "Medium" : "Low";
    return { risk_level, score, source: "local" };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = {
      Age: parseInt(formData.Age),
      BMI: parseFloat(formData.BMI),
      BloodPressure: parseFloat(formData.BloodPressure),
      Cholesterol: parseFloat(formData.Cholesterol),
      Glucose: parseFloat(formData.Glucose),
      Sex: parseInt(formData.Sex),
    };
    try {
      // Call ML service directly
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("ML service error");
      const mlResult = await res.json();

      // Extract combined risk level from ML response
      const diabetesRisk = mlResult.diabetes?.risk_level || "Low";
      const heartRisk = mlResult.heart_disease?.risk_level || "Low";
      const riskOrder = { High: 3, Medium: 2, Low: 1 };
      const risk_level = riskOrder[diabetesRisk] >= riskOrder[heartRisk] ? diabetesRisk : heartRisk;

      const result = {
        risk_level,
        diabetes: mlResult.diabetes,
        heart_disease: mlResult.heart_disease,
        department: mlResult.recommendations?.department,
        source: "ml",
      };

      setPrediction(result);
      try { await api.post("/assessments/save", { ...data, ...result }); } catch {}
      const uid = (() => { try { return JSON.parse(localStorage.getItem("user"))?.userId || "guest"; } catch { return "guest"; } })();
      sessionStorage.setItem(`lastAssessment_${uid}`, JSON.stringify({ ...data, ...result, timestamp: new Date().toISOString() }));
    } catch (err) {
      // Fallback to local calculation
      const local = calculateLocalRisk(data);
      setPrediction(local);
      try { await api.post("/assessments/save", { ...data, ...local }); } catch {}
      const uid = (() => { try { return JSON.parse(localStorage.getItem("user"))?.userId || "guest"; } catch { return "guest"; } })();
      sessionStorage.setItem(`lastAssessment_${uid}`, JSON.stringify({ ...data, ...local, timestamp: new Date().toISOString() }));
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "Low": return "text-green-600 bg-green-100";
      case "Medium": return "text-yellow-600 bg-yellow-100";
      case "High": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("symptom-checker")}
          className={`px-6 py-3 font-bold transition border-b-4 ${
            activeTab === "symptom-checker" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-blue-600"
          }`}
        >
          🤖 AI Symptom Checker
        </button>
        <button
          onClick={() => setActiveTab("risk-assessment")}
          className={`px-6 py-3 font-bold transition border-b-4 ${
            activeTab === "risk-assessment" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-blue-600"
          }`}
        >
          💊 Risk Assessment
        </button>
      </div>

      {activeTab === "symptom-checker" && <SymptomChecker />}

      {activeTab === "risk-assessment" && (
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-brand-light to-brand-dark text-white py-2 rounded-lg">
            💊 Health Risk Assessment
          </h2>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Age", key: "Age", type: "number", step: "1" },
              { label: "BMI", key: "BMI", type: "number", step: "0.1" },
              { label: "Blood Pressure (mmHg)", key: "BloodPressure", type: "number", step: "1" },
              { label: "Cholesterol (mg/dL)", key: "Cholesterol", type: "number", step: "1" },
              { label: "Glucose (mg/dL)", key: "Glucose", type: "number", step: "1" },
            ].map(({ label, key, type, step }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">{label}</label>
                <input
                  type={type}
                  step={step}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  required
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.Sex}
                onChange={(e) => setFormData({ ...formData, Sex: e.target.value })}
              >
                <option value="0">Female</option>
                <option value="1">Male</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 bg-gradient-to-r from-brand-light to-brand-dark text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Get Risk Assessment"}
            </button>
          </form>

          {prediction && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-bold mb-4 text-blue-900">Assessment Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 font-semibold">Overall Risk</p>
                  <span className={`inline-block text-2xl font-bold mt-2 px-4 py-2 rounded-lg ${getRiskColor(prediction.risk_level)}`}>
                    {prediction.risk_level}
                  </span>
                </div>
                {prediction.diabetes && (
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 font-semibold">🩸 Diabetes Risk</p>
                    <p className={`text-xl font-bold mt-2 ${getRiskColor(prediction.diabetes.risk_level).split(" ")[0]}`}>
                      {prediction.diabetes.risk_level}
                    </p>
                    <p className="text-sm text-gray-500">{(prediction.diabetes.probability * 100).toFixed(1)}%</p>
                  </div>
                )}
                {prediction.heart_disease && (
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 font-semibold">❤️ Heart Disease Risk</p>
                    <p className={`text-xl font-bold mt-2 ${getRiskColor(prediction.heart_disease.risk_level).split(" ")[0]}`}>
                      {prediction.heart_disease.risk_level}
                    </p>
                    <p className="text-sm text-gray-500">{(prediction.heart_disease.probability * 100).toFixed(1)}%</p>
                  </div>
                )}
              </div>
              {prediction.department && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-800">🏥 Recommended Department: <strong>{prediction.department}</strong></p>
                </div>
              )}
              <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> {prediction.source === "local"
                    ? "This is a local estimate based on clinical thresholds."
                    : "This is an AI-powered assessment."} Please consult with a healthcare professional for a proper diagnosis.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
