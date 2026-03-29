import React, { useState, useEffect } from "react";

const SymptomChecker = () => {
  const [step, setStep] = useState(1); // 1: Input, 2: Results, 3: Doctor Selection
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [symptoms, setSymptoms] = useState({});
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("09:00");

  // Fetch symptoms on component mount
  useEffect(() => {
    const symptomList = [
      "fever", "cough", "fatigue", "shortness_of_breath", "chest_pain",
      "headache", "nausea", "vomiting", "diarrhea", "abdominal_pain",
      "back_pain", "joint_pain", "muscle_pain", "dizziness", "sweating",
      "chills", "loss_of_appetite", "weight_loss", "swelling", "rash",
      "sore_throat", "runny_nose", "blurred_vision", "frequent_urination",
      "excessive_thirst", "palpitations", "numbness", "anxiety", "insomnia"
    ];
    setAvailableSymptoms(symptomList);
    const initialSymptoms = {};
    symptomList.forEach((symptom) => { initialSymptoms[symptom] = 0; });
    setSymptoms(initialSymptoms);
  }, []);

  const handleSymptomChange = (symptom, value) => {
    setSymptoms({
      ...symptoms,
      [symptom]: parseFloat(value),
    });
  };

  const handlePredict = async (e) => {
    e.preventDefault();

    if (!age) {
      setError("Please enter your age");
      return;
    }

    const hasSymptoms = Object.values(symptoms).some((v) => v > 0);
    if (!hasSymptoms) {
      setError("Please select at least one symptom");
      return;
    }

    setLoading(true);
    setError("");

    // Local prediction logic — no backend needed
    setTimeout(() => {
      const active = Object.entries(symptoms).filter(([, v]) => v > 0);
      const score = active.reduce((sum, [, v]) => sum + v, 0);

      let disease = "General Health Concern";
      let dept = "General Medicine";

      const names = active.map(([s]) => s);

      if (names.some(s => ["chest_pain", "palpitations", "shortness_of_breath"].includes(s))) {
        disease = "Possible Cardiac Issue"; dept = "Cardiology";
      } else if (names.some(s => ["frequent_urination", "excessive_thirst", "weight_loss"].includes(s))) {
        disease = "Possible Diabetes"; dept = "Endocrinology";
      } else if (names.some(s => ["fever", "cough", "sore_throat", "runny_nose", "chills"].includes(s))) {
        disease = "Respiratory Infection"; dept = "General Medicine";
      } else if (names.some(s => ["headache", "dizziness", "numbness", "blurred_vision"].includes(s))) {
        disease = "Neurological Concern"; dept = "Neurology";
      } else if (names.some(s => ["abdominal_pain", "nausea", "vomiting", "diarrhea"].includes(s))) {
        disease = "Gastrointestinal Issue"; dept = "General Medicine";
      } else if (names.some(s => ["joint_pain", "back_pain", "muscle_pain", "swelling"].includes(s))) {
        disease = "Musculoskeletal Issue"; dept = "General Medicine";
      }

      const risk_level = score > 8 ? "High" : score > 4 ? "Medium" : "Low";
      const confidence = Math.min(95, 45 + active.length * 5);

      const explanation = {};
      active.forEach(([s, v]) => { explanation[s] = parseFloat((v / 3).toFixed(2)); });

      const result = { predicted_disease: disease, confidence, risk_level, recommended_department: dept, explanation };

      // Save to sessionStorage so AssessmentSummary can read it
      const assessmentData = {
        symptoms: Object.fromEntries(active),
        predicted_disease: disease,
        risk_level,
        confidence,
        recommended_department: dept,
        age: parseInt(age),
        gender,
        timestamp: new Date().toISOString(),
        source: "symptom_checker",
      };
      const uid = (() => { try { return JSON.parse(localStorage.getItem("user"))?.userId || "guest"; } catch { return "guest"; } })();
      sessionStorage.setItem(`lastAssessment_${uid}`, JSON.stringify(assessmentData));

      // Save to backend
      try {
        const token = localStorage.getItem("healthcare_token");
        fetch("/api/assessments/save", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ Age: parseInt(age), risk_level, source: "symptom_checker" }),
        }).catch(() => {});
      } catch {}

      setPrediction(result);
      setStep(2);
      setLoading(false);

      // Fetch doctors for the recommended department
      fetch(`http://localhost:8081/api/appointments/doctors/available`)
        .then(r => r.json())
        .then(allDoctors => {
          // Match by departmentName or specialization (case-insensitive, partial match)
          const matched = allDoctors.filter(d => {
            const deptName = (d.departmentName || "").toLowerCase();
            const spec = (d.specialization || "").toLowerCase();
            const rec = dept.toLowerCase();
            return deptName.includes(rec) || rec.includes(deptName) ||
                   spec.includes(rec) || rec.includes(spec);
          });
          setDoctors(matched.length > 0 ? matched : allDoctors);
        })
        .catch(() => setDoctors([]));
    }, 800);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "bg-green-100 border-green-500 text-green-700";
      case "medium":
        return "bg-yellow-100 border-yellow-500 text-yellow-700";
      case "high":
        return "bg-red-100 border-red-500 text-red-700";
      default:
        return "bg-gray-100 border-gray-500 text-gray-700";
    }
  };

  const getSeverityLabel = (value) => {
    const severityMap = {
      0: "None",
      1: "Mild",
      2: "Moderate",
      3: "Severe",
    };
    return severityMap[value] || "None";
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !appointmentDate || !timeSlot) {
      setError("Please select a doctor, date, and time slot");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const patientId = user.mysqlId || user.userId;
      const response = await fetch("http://localhost:8081/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: String(selectedDoctor.userId),
          date: appointmentDate,
          timeSlot,
          department: selectedDoctor.departmentName || selectedDoctor.specialization,
          reason: `Based on symptom assessment: ${prediction.predicted_disease}`,
          patientId: patientId ? String(patientId) : null,
          patientEmail: user.email,
        }),
      });
      if (!response.ok) throw new Error("Booking failed");
      alert("✅ Appointment booked successfully!");
      setStep(1);
      setAge(""); setGender("male"); setSymptoms({});
      setPrediction(null); setSelectedDoctor(null);
    } catch (err) {
      setError(err.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            🤖 AI Symptom Checker
          </h1>
          <p className="text-gray-600">
            Describe your symptoms and get personalized health recommendations
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Symptom Input */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📋</span> Patient Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter your age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Symptoms Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🩺</span> Select Your Symptoms
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Move the slider to indicate severity (0 = None, 3 = Severe)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableSymptoms.map((symptom) => (
                  <div
                    key={symptom}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-medium text-gray-700 capitalize">
                        {symptom.replace(/_/g, " ")}
                      </label>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {getSeverityLabel(symptoms[symptom])}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.5"
                      value={symptoms[symptom]}
                      onChange={(e) =>
                        handleSymptomChange(symptom, e.target.value)
                      }
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>None</span>
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing Symptoms..." : "🔍 Get Health Assessment"}
            </button>
          </div>
        )}

        {/* Step 2: Prediction Results */}
        {step === 2 && prediction && (
          <div className="space-y-6">
            {/* Main Prediction Card */}
            <div
              className={`rounded-lg shadow-lg p-8 border-l-4 ${getRiskColor(prediction.risk_level)}`}
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">
                  {prediction.predicted_disease}
                </h2>
                <p className="text-gray-600">
                  Based on your symptoms assessment
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <div className="text-sm text-gray-600 font-semibold mb-1">
                    CONFIDENCE LEVEL
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {prediction.confidence}%
                  </div>
                </div>

                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <div className="text-sm text-gray-600 font-semibold mb-1">
                    RISK LEVEL
                  </div>
                  <div
                    className={`text-3xl font-bold ${getRiskColor(prediction.risk_level).split(" ")[2]}`}
                  >
                    {prediction.risk_level}
                  </div>
                </div>

                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <div className="text-sm text-gray-600 font-semibold mb-1">
                    RECOMMENDED DEPARTMENT
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {prediction.recommended_department}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-white bg-opacity-70 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">
                  Contributing Symptoms
                </h3>
                <div className="space-y-2">
                  {Object.entries(prediction.explanation).map(
                    ([symptom, importance]) => (
                      <div key={symptom} className="flex items-center gap-3">
                        <div className="flex-grow">
                          <div className="text-sm font-medium text-gray-700 capitalize">
                            {symptom.replace(/_/g, " ")}
                          </div>
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                            style={{ width: `${importance * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-12 text-right">
                          {Math.round(importance * 100)}%
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>👨‍⚕️</span> Available Specialists
              </h2>

              {doctors.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.userId || doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedDoctor?.userId === doctor.userId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            Dr. {doctor.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {doctor.specialization}
                          </p>
                          {doctor.departmentName && (
                            <p className="text-xs text-gray-500 mt-1">🏥 {doctor.departmentName}</p>
                          )}
                          {doctor.experienceYears && (
                            <p className="text-xs text-gray-500">🎓 {doctor.experienceYears} yrs experience</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            ✅ Available
                          </div>
                          {doctor.consultationFee && (
                            <p className="text-xs text-gray-500 mt-1">₹{doctor.consultationFee}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-6 italic">No specialists found for this department.</p>
              )}

              {selectedDoctor && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-gray-800 mb-4">
                    Schedule Appointment
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Preferred Time
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleBookAppointment}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Booking..." : "📅 Book Appointment"}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setAge("");
                  setGender("male");
                  setSymptoms({});
                  setPrediction(null);
                  setSelectedDoctor(null);
                }}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition"
              >
                🔄 New Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomChecker;
