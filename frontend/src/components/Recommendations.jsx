import React, { useState, useEffect } from "react";
import api, { getHealthHistory } from "../services/api";

function Recommendations() {
  const [assessment, setAssessment] = useState(null);
  const [healthRecord, setHealthRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notifPermission, setNotifPermission] = useState("default");
  const [medicationTimes, setMedicationTimes] = useState({
    morning: "08:00",
    afternoon: "13:00",
    evening: "20:00",
  });
  const [activeReminders, setActiveReminders] = useState([]);
  const [reminderIntervals, setReminderIntervals] = useState([]);

  useEffect(() => {
    fetchData();
    checkNotificationPermission();
    return () => reminderIntervals.forEach(clearInterval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch latest assessment
      const stored = sessionStorage.getItem("lastAssessment");
      if (stored) {
        try { setAssessment(JSON.parse(stored)); } catch {}
      }

      // Fetch latest health record with recommendations
      const healthData = await getHealthHistory();
      if (healthData && healthData.length > 0) {
        const latestRecord = healthData[0]; // Most recent
        setHealthRecord(latestRecord);
      }

      // Fallback to assessment API if no health record
      if (!healthRecord && !assessment) {
        try {
          const res = await api.get("/assessments/latest");
          if (res.data) {
            const d = res.data;
            setAssessment({
              Age: d.age, BMI: d.bmi, BloodPressure: d.bloodPressure,
              Cholesterol: d.cholesterol, Glucose: d.glucose,
              risk_level: d.riskLevel, source: d.source,
              predicted_disease: d.predictedDisease,
            });
          } else {
            // Sample data for demonstration
            setAssessment({
              Age: 35, BMI: 24.5, BloodPressure: "120/80",
              Cholesterol: 180, Glucose: 95,
              risk_level: "low", source: "risk_assessment",
              predicted_disease: null,
              timestamp: new Date().toISOString()
            });
          }
        } catch {
          // Sample data for demonstration
          setAssessment({
            Age: 35, BMI: 24.5, BloodPressure: "120/80",
            Cholesterol: 180, Glucose: 95,
            risk_level: "low", source: "risk_assessment",
            predicted_disease: null,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Sample data for demonstration
      setAssessment({
        Age: 35, BMI: 24.5, BloodPressure: "120/80",
        Cholesterol: 180, Glucose: 95,
        risk_level: "low", source: "risk_assessment",
        predicted_disease: null,
        timestamp: new Date().toISOString()
      });
    }
    setLoading(false);
  };

  const checkNotificationPermission = () => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === "granted") {
        new Notification("HealthChain Notifications Enabled", {
          body: "You will now receive medication and health alerts.",
          icon: "/favicon.ico",
        });
        addNotification("✅ Notifications enabled successfully!", "success");
      }
    } else {
      addNotification("❌ Your browser does not support notifications.", "error");
    }
  };

  const addNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications(prev => [{ id, message, type, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
  };

  const sendBrowserNotification = (title, body) => {
    if (notifPermission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
    addNotification(`🔔 ${title}: ${body}`, "alert");
  };

  const scheduleMedicationReminder = (label, time, pills) => {
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const delay = target - now;
    const timeoutId = setTimeout(() => {
      sendBrowserNotification(`💊 ${label} Medication Reminder`, `Time to take your ${pills}. Stay healthy!`);
      // Repeat every 24 hours
      const intervalId = setInterval(() => {
        sendBrowserNotification(`💊 ${label} Medication Reminder`, `Time to take your ${pills}. Stay healthy!`);
      }, 24 * 60 * 60 * 1000);
      setReminderIntervals(prev => [...prev, intervalId]);
    }, delay);

    setActiveReminders(prev => [...prev, { label, time, pills }]);
    setReminderIntervals(prev => [...prev, timeoutId]);
    addNotification(`⏰ Reminder set for ${label} at ${time} — ${pills}`, "success");
  };

  const getRecommendations = () => {
    if (!assessment && !healthRecord) return { diet: [], exercise: [], medications: [], warnings: [], healthScore: null };

    // Use health record if available, otherwise fall back to assessment
    const data = healthRecord || assessment;
    const hasHealthScore = healthRecord && healthRecord.healthScore;
    const healthScore = hasHealthScore ? (typeof healthRecord.healthScore === 'object' ? healthRecord.healthScore.overall : healthRecord.healthScore) : null;

    // Determine risk level from health score or assessment
    let riskLevel = "low";
    if (healthScore !== null) {
      if (healthScore < 40) riskLevel = "high";
      else if (healthScore < 70) riskLevel = "medium";
      else riskLevel = "low";
    } else {
      riskLevel = (data.risk_level || "low").toLowerCase();
    }

    const isSymptom = data.source === "symptom_checker" || data.predicted_disease;

    // Use backend recommendations if available
    if (healthRecord && healthRecord.recommendations) {
      const backendRecs = healthRecord.recommendations;
      return {
        diet: backendRecs.diet || [],
        exercise: backendRecs.exercise || [],
        medications: getMedicationsForRisk(riskLevel, isSymptom, data.predicted_disease),
        warnings: getWarningsForRisk(riskLevel, isSymptom, data.predicted_disease, backendRecs.department),
        healthScore: healthScore,
        department: backendRecs.department,
      };
    }

    // Fallback to frontend logic
    const diet = {
      high: [
        "🥗 Strict low-sugar, low-sodium diet",
        "🚫 Avoid processed foods, red meat, fried foods",
        "🫐 Eat antioxidant-rich foods: berries, leafy greens",
        "🐟 Omega-3 rich fish twice a week",
        "💧 8+ glasses of water daily",
        "🌾 Whole grains over refined carbs",
      ],
      medium: [
        "🥦 5 servings of vegetables and fruits daily",
        "🚫 Reduce sugar and salt intake",
        "🥜 Nuts and seeds as healthy snacks",
        "🐟 Include fish twice a week",
        "💧 Stay well hydrated",
      ],
      low: [
        "🥗 Maintain a balanced diet with variety",
        "🍎 5 portions of fruits and vegetables daily",
        "🌾 Choose whole grain options",
        "💧 6-8 glasses of water daily",
      ],
    };

    const exercise = {
      high: [
        "🚶 20-minute gentle walks daily",
        "🧘 Yoga or tai chi for stress reduction",
        "⚠️ Consult doctor before intense exercise",
        "🏊 Low-impact swimming recommended",
      ],
      medium: [
        "🚶 30 minutes walking daily",
        "🚴 Cycling or swimming 3-4 times/week",
        "🧘 Stretching and flexibility exercises",
        "💪 Light strength training twice a week",
      ],
      low: [
        "🏃 150 minutes moderate exercise per week",
        "💪 Strength training 2-3 times/week",
        "🧘 Yoga or meditation for wellness",
        "🚴 Mix cardio and strength activities",
      ],
    };

    const medications = getMedicationsForRisk(riskLevel, isSymptom, data.predicted_disease);
    const warnings = getWarningsForRisk(riskLevel, isSymptom, data.predicted_disease);

    return {
      diet: diet[riskLevel] || diet.low,
      exercise: exercise[riskLevel] || exercise.low,
      medications,
      warnings,
      healthScore,
    };
  };

  const getMedicationsForRisk = (riskLevel, isSymptom, predictedDisease) => {
    const medications = {
      high: [
        { name: "Blood Pressure Medication", time: "morning", pills: "BP tablet (as prescribed)", icon: "💊" },
        { name: "Cholesterol Medication", time: "evening", pills: "Statin tablet (as prescribed)", icon: "💊" },
        { name: "Vitamin D & Calcium", time: "afternoon", pills: "Vitamin D3 + Calcium supplement", icon: "🌟" },
        { name: "Omega-3 Supplement", time: "morning", pills: "Fish oil capsule", icon: "🐟" },
      ],
      medium: [
        { name: "Multivitamin", time: "morning", pills: "Daily multivitamin tablet", icon: "💊" },
        { name: "Vitamin D", time: "afternoon", pills: "Vitamin D3 supplement", icon: "🌟" },
        { name: "Omega-3 Supplement", time: "evening", pills: "Fish oil capsule", icon: "🐟" },
      ],
      low: [
        { name: "Multivitamin", time: "morning", pills: "Daily multivitamin tablet", icon: "💊" },
        { name: "Vitamin C", time: "afternoon", pills: "Vitamin C 500mg", icon: "🍊" },
      ],
    };

    let meds = medications[riskLevel] || medications.low;

    // Add disease-specific medications
    if (isSymptom && predictedDisease) {
      const disease = predictedDisease.toLowerCase();
      if (disease.includes("cardiac") || disease.includes("heart")) {
        meds.unshift({ name: "Aspirin (Low Dose)", time: "morning", pills: "Aspirin 75mg (consult doctor)", icon: "❤️" });
      } else if (disease.includes("diabetes")) {
        meds.unshift({ name: "Blood Sugar Monitor", time: "morning", pills: "Check fasting blood sugar", icon: "🩸" });
      } else if (disease.includes("respiratory") || disease.includes("infection")) {
        meds.unshift({ name: "Vitamin C & Zinc", time: "morning", pills: "Vitamin C 1000mg + Zinc 10mg", icon: "🍊" });
      }
    }

    return meds;
  };

  const getWarningsForRisk = (riskLevel, isSymptom, predictedDisease, department) => {
    const warnings = {
      high: [
        { msg: "🚨 Schedule immediate doctor consultation", type: "critical" },
        { msg: "📊 Monitor blood pressure and glucose daily", type: "critical" },
        { msg: "🚫 Avoid smoking and alcohol completely", type: "warning" },
        { msg: "😴 Ensure 7-8 hours of quality sleep", type: "info" },
        { msg: "😰 Manage stress through relaxation techniques", type: "info" },
      ],
      medium: [
        { msg: "⚠️ Schedule doctor check-up within 1 month", type: "warning" },
        { msg: "📊 Monitor vitals weekly", type: "warning" },
        { msg: "🚫 Limit alcohol and avoid smoking", type: "info" },
        { msg: "😴 Maintain regular sleep schedule", type: "info" },
      ],
      low: [
        { msg: "✅ Keep up your healthy lifestyle", type: "success" },
        { msg: "📅 Annual health check-up recommended", type: "info" },
        { msg: "😴 Maintain 7-8 hours of sleep", type: "info" },
        { msg: "😊 Continue stress management practices", type: "info" },
      ],
    };

    let warns = warnings[riskLevel] || warnings.low;

    // Add department-specific warnings
    if (department) {
      warns.unshift({ msg: `🏥 Recommended consultation: ${department} Department`, type: "warning" });
    }

    // Add disease-specific warnings
    if (isSymptom && predictedDisease) {
      const disease = predictedDisease.toLowerCase();
      if (disease.includes("cardiac") || disease.includes("heart")) {
        warns.unshift({ msg: "🚨 Cardiac symptoms detected — consult cardiologist immediately", type: "critical" });
      } else if (disease.includes("diabetes")) {
        warns.unshift({ msg: "🩸 Diabetes risk detected — monitor blood sugar daily", type: "critical" });
      }
    }

    return warns;
  };

  if (loading) return <div className="text-center py-12">Loading recommendations...</div>;

  const recs = getRecommendations();
  const level = assessment ? (assessment.risk_level || "Low") : "Low";
  const levelColor = level.toLowerCase() === "high"
    ? "bg-red-100 text-red-800 border-red-300"
    : level.toLowerCase() === "medium"
    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
    : "bg-green-100 text-green-800 border-green-300";

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with Health Score */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">💡 Personalized Recommendations</h2>
        {recs.healthScore !== null && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Health Score</div>
            <div className={`text-2xl font-bold ${
              recs.healthScore >= 80 ? 'text-green-600' :
              recs.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {recs.healthScore}/100
            </div>
          </div>
        )}
      </div>

      {/* Assessment Summary Section */}
      {(!loading) && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Assessment Summary
            <span className="text-sm text-gray-500">
              {assessment?.timestamp ? new Date(assessment.timestamp).toLocaleDateString() : 'Latest'}
            </span>
          </h3>

          {(assessment || healthRecord) ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Risk Level */}
                <div className={`p-4 rounded-lg text-center border-2 ${levelColor}`}>
                  <p className="text-xs font-medium uppercase tracking-wide">Risk Level</p>
                  <p className="text-2xl font-bold mt-1">{level}</p>
                </div>

                {/* Health Score */}
                {recs.healthScore !== null && (
                  <div className="p-4 rounded-lg text-center border-2 border-blue-300 bg-blue-50">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Health Score</p>
                    <p className="text-2xl font-bold mt-1 text-blue-700">{recs.healthScore}/100</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {recs.healthScore >= 80 ? 'Excellent' :
                       recs.healthScore >= 60 ? 'Good' :
                       recs.healthScore >= 40 ? 'Fair' : 'Poor'}
                    </p>
                  </div>
                )}

                {/* Source */}
                <div className="p-4 rounded-lg text-center border-2 border-gray-300 bg-gray-50">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Assessment Source</p>
                  <p className="text-lg font-bold mt-1 text-gray-700">
                    {assessment?.source === "symptom_checker" || healthRecord ? "🤖 AI Analysis" : "💊 Risk Assessment"}
                  </p>
                </div>

                {/* Department */}
                {recs.department && (
                  <div className="p-4 rounded-lg text-center border-2 border-purple-300 bg-purple-50">
                    <p className="text-xs font-medium uppercase tracking-wide text-purple-600">Department</p>
                    <p className="text-lg font-bold mt-1 text-purple-700">{recs.department}</p>
                  </div>
                )}
              </div>

              {/* Vital Signs Summary */}
              {assessment && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">📈 Key Health Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {assessment.Age && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="text-lg font-bold">{assessment.Age} years</p>
                      </div>
                    )}
                    {assessment.BMI && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">BMI</p>
                        <p className="text-lg font-bold">{assessment.BMI}</p>
                      </div>
                    )}
                    {assessment.BloodPressure && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Blood Pressure</p>
                        <p className="text-lg font-bold">{assessment.BloodPressure}</p>
                      </div>
                    )}
                    {assessment.Glucose && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Glucose</p>
                        <p className="text-lg font-bold">{assessment.Glucose} mg/dL</p>
                      </div>
                    )}
                    {assessment.Cholesterol && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Cholesterol</p>
                        <p className="text-lg font-bold">{assessment.Cholesterol} mg/dL</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Predicted Disease */}
              {(assessment?.predicted_disease || healthRecord?.predictions) && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-700 mb-2">🔍 AI Analysis Results</h4>
                  {assessment?.predicted_disease && (
                    <p className="text-indigo-800">
                      <span className="font-medium">Predicted Condition:</span> {assessment.predicted_disease}
                    </p>
                  )}
                  {healthRecord?.predictions && (
                    <div className="mt-2 space-y-1">
                      {healthRecord.predictions.diabetes && (
                        <p className="text-sm text-indigo-700">
                          🩸 Diabetes Risk: {healthRecord.predictions.diabetes.probability}% ({healthRecord.predictions.diabetes.riskLevel})
                        </p>
                      )}
                      {healthRecord.predictions.heartDisease && (
                        <p className="text-sm text-indigo-700">
                          ❤️ Heart Disease Risk: {healthRecord.predictions.heartDisease.probability}% ({healthRecord.predictions.heartDisease.riskLevel})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">📊 No Assessment Data Available</p>
              <p className="text-sm">Complete the AI Symptom Checker or Risk Assessment to see your health summary here.</p>
            </div>
          )}
        </div>
      )}

      {/* Notification Permission Banner */}
      {notifPermission !== "granted" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-800">🔔 Enable Medication Reminders</p>
            <p className="text-sm text-blue-600 mt-1">Get browser notifications for medication times and health alerts</p>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Notification Log */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">🔔 Notification Log</h3>
            <button onClick={() => setNotifications([])} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-2 p-2 rounded text-sm ${
                n.type === "success" ? "bg-green-50 text-green-700"
                : n.type === "error" ? "bg-red-50 text-red-700"
                : n.type === "alert" ? "bg-orange-50 text-orange-700"
                : "bg-gray-50 text-gray-700"
              }`}>
                <span className="text-xs text-gray-400 whitespace-nowrap">{n.time}</span>
                <span>{n.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">💊 Your Personalized Recommendations</h3>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-purple-700">💊 Medication & Supplement Reminders</h3>

        {/* Time Settings */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          {["morning", "afternoon", "evening"].map((time) => (
            <div key={time}>
              <label className="block text-xs text-gray-500 capitalize mb-1">{time} time</label>
              <input
                type="time"
                value={medicationTimes[time]}
                onChange={(e) => setMedicationTimes(prev => ({ ...prev, [time]: e.target.value }))}
                className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {recs.medications.map((med, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{med.icon}</span>
                <div>
                  <p className="font-medium text-gray-800">{med.name}</p>
                  <p className="text-sm text-gray-500">{med.pills}</p>
                  <p className="text-xs text-purple-600 capitalize">⏰ {med.time} — {medicationTimes[med.time]}</p>
                </div>
              </div>
              <button
                onClick={() => scheduleMedicationReminder(med.name, medicationTimes[med.time], med.pills)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  activeReminders.some(r => r.label === med.name)
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {activeReminders.some(r => r.label === med.name) ? "✓ Set" : "Set Reminder"}
              </button>
            </div>
          ))}
        </div>

        {activeReminders.length > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✅ {activeReminders.length} reminder(s) active — you'll get notified at the scheduled times
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Health Alerts */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-700">🚨 Health Alerts</h3>
        <div className="space-y-2">
          {recs.warnings.map((w, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${
              w.type === "critical" ? "bg-red-50 border border-red-200"
              : w.type === "warning" ? "bg-yellow-50 border border-yellow-200"
              : w.type === "success" ? "bg-green-50 border border-green-200"
              : "bg-blue-50 border border-blue-200"
            }`}>
              <p className="text-sm text-gray-700">{w.msg}</p>
              <button
                onClick={() => sendBrowserNotification("Health Alert", w.msg.replace(/[^\w\s]/gi, ""))}
                className="ml-3 text-xs bg-white border px-2 py-1 rounded hover:bg-gray-50 transition whitespace-nowrap"
              >
                🔔 Notify
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Diet & Exercise */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-700">🥗 Diet Recommendations</h3>
          <ul className="space-y-2">
            {recs.diet.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 p-2 bg-green-50 rounded">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700">🏃 Exercise Plan</h3>
          <ul className="space-y-2">
            {recs.exercise.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 p-2 bg-blue-50 rounded">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Send All Alerts Button */}
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-700">📢 Send All Health Alerts Now</p>
          <p className="text-sm text-gray-500">Push all current health warnings as browser notifications</p>
        </div>
        <button
          onClick={() => {
            recs.warnings.forEach((w, i) => {
              setTimeout(() => sendBrowserNotification("Health Alert", w.msg.replace(/[^\w\s]/gi, "")), i * 1000);
            });
          }}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition font-medium"
        >
          Send All 🔔
        </button>
      </div>
    </div>
  );
}

export default Recommendations;
