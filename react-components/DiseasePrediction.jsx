import React, { useState } from 'react';
import axios from 'axios';

const DiseasePrediction = () => {
  const [formData, setFormData] = useState({
    age: '',
    bpSystolic: '',
    bpDiastolic: '',
    sugarLevel: '',
    bmi: '',
    cholesterol: '',
    symptoms: []
  });
  
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const symptomsList = [
    'Chest Pain', 'Shortness of Breath', 'Fatigue', 'Dizziness',
    'Frequent Urination', 'Excessive Thirst', 'Blurred Vision',
    'Headache', 'Nausea', 'Irregular Heartbeat'
  ];

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const res = await axios.post('http://localhost:8080/api/ai/predict', {
        age: parseInt(formData.age),
        bpSystolic: parseInt(formData.bpSystolic),
        bpDiastolic: parseInt(formData.bpDiastolic),
        sugarLevel: parseFloat(formData.sugarLevel),
        bmi: parseFloat(formData.bmi),
        cholesterol: parseInt(formData.cholesterol),
        symptoms: formData.symptoms
      });
      
      setPrediction(res.data);
    } catch (err) {
      setError('Prediction failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === 'High Risk') return 'text-red-600 bg-red-50';
    if (risk === 'Moderate Risk') return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">AI Disease Prediction</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Patient Parameters</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.bmi}
                  onChange={(e) => setFormData({...formData, bmi: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  min="10"
                  max="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BP Systolic</label>
                <input
                  type="number"
                  value={formData.bpSystolic}
                  onChange={(e) => setFormData({...formData, bpSystolic: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  min="80"
                  max="200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BP Diastolic</label>
                <input
                  type="number"
                  value={formData.bpDiastolic}
                  onChange={(e) => setFormData({...formData, bpDiastolic: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  min="50"
                  max="130"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sugar Level (mg/dL)</label>
                <input
                  type="number"
                  value={formData.sugarLevel}
                  onChange={(e) => setFormData({...formData, sugarLevel: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  min="50"
                  max="400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cholesterol (mg/dL)</label>
                <input
                  type="number"
                  value={formData.cholesterol}
                  onChange={(e) => setFormData({...formData, cholesterol: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  min="100"
                  max="400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
              <div className="grid grid-cols-2 gap-2">
                {symptomsList.map(symptom => (
                  <label key={symptom} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.includes(symptom)}
                      onChange={() => handleSymptomToggle(symptom)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">{symptom}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Analyzing...' : 'Predict Disease Risk'}
            </button>
          </form>
        </div>

        {/* Prediction Results */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>
          
          {!prediction ? (
            <div className="text-center py-12 text-gray-500">
              Fill in the patient parameters and click "Predict Disease Risk" to see results
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Risk */}
              <div className={`p-4 rounded-lg ${getRiskColor(prediction.overallRisk)}`}>
                <h3 className="font-semibold text-lg">Overall Risk</h3>
                <p className="text-2xl font-bold">{prediction.overallRisk}</p>
              </div>

              {/* Individual Risks */}
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Diabetes</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(prediction.diabetesPrediction)}`}>
                      {prediction.diabetesPrediction}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{width: `${prediction.diabetesRisk}%`}}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{prediction.diabetesRisk}% Risk</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Heart Disease</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(prediction.heartDiseasePrediction)}`}>
                      {prediction.heartDiseasePrediction}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{width: `${prediction.heartDiseaseRisk}%`}}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{prediction.heartDiseaseRisk}% Risk</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Hypertension</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(prediction.hypertensionPrediction)}`}>
                      {prediction.hypertensionPrediction}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{width: `${prediction.hypertensionRisk}%`}}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{prediction.hypertensionRisk}% Risk</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <ul className="space-y-1">
                  {prediction.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseasePrediction;
