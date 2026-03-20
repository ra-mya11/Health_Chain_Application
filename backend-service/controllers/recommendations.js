/**
 * Calculate Digital Health Score
 * Formula: (Clinical Score * 0.4) + (AI Risk Score * 0.4) + (Lifestyle Score * 0.2)
 */
function calculateHealthScore(predictions, vitals) {
  // Clinical Score (0-100) based on vitals
  let clinicalScore = 100;
  
  if (vitals.BMI > 30) clinicalScore -= 20;
  else if (vitals.BMI > 25) clinicalScore -= 10;
  
  if (vitals.BloodPressure > 140) clinicalScore -= 20;
  else if (vitals.BloodPressure > 120) clinicalScore -= 10;
  
  if (vitals.Cholesterol > 240) clinicalScore -= 20;
  else if (vitals.Cholesterol > 200) clinicalScore -= 10;
  
  // AI Risk Score (0-100) - inverse of risk probabilities
  const diabetesRisk = predictions.diabetes.probability;
  const heartRisk = predictions.heart_disease.probability;
  const avgRisk = (diabetesRisk + heartRisk) / 2;
  const aiRiskScore = (1 - avgRisk) * 100;
  
  // Lifestyle Score (placeholder - would be based on activity tracking)
  const lifestyleScore = 70; // Default moderate score
  
  // Calculate overall score
  const overall = Math.round(
    (clinicalScore * 0.4) + (aiRiskScore * 0.4) + (lifestyleScore * 0.2)
  );
  
  return {
    overall: Math.max(0, Math.min(100, overall)),
    clinical: Math.round(clinicalScore),
    aiRisk: Math.round(aiRiskScore),
    lifestyle: lifestyleScore
  };
}

/**
 * Get diet recommendations based on predictions
 */
function getDietRecommendations(predictions) {
  const recommendations = [];
  
  // Diabetes recommendations
  if (predictions.diabetes.risk_level === 'High') {
    recommendations.push('Low sugar diet - Avoid refined carbohydrates');
    recommendations.push('High fiber foods - Whole grains, vegetables');
    recommendations.push('Lean proteins - Fish, chicken, legumes');
    recommendations.push('Avoid sugary drinks and processed foods');
  } else if (predictions.diabetes.risk_level === 'Medium') {
    recommendations.push('Moderate carbohydrate intake');
    recommendations.push('Include complex carbohydrates');
  }
  
  // Heart disease recommendations
  if (predictions.heart_disease.risk_level === 'High') {
    recommendations.push('Low cholesterol diet - Reduce saturated fats');
    recommendations.push('Omega-3 rich foods - Salmon, walnuts, flaxseeds');
    recommendations.push('Reduce sodium intake - Less than 2300mg/day');
    recommendations.push('Increase fruits and vegetables');
  } else if (predictions.heart_disease.risk_level === 'Medium') {
    recommendations.push('Heart-healthy fats - Olive oil, avocados');
    recommendations.push('Limit red meat consumption');
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Balanced diet with variety of nutrients');
    recommendations.push('Stay hydrated - 8 glasses of water daily');
    recommendations.push('Regular meal times');
  }
  
  return recommendations;
}

/**
 * Get exercise recommendations based on predictions and BMI
 */
function getExerciseRecommendations(predictions, bmi) {
  const recommendations = [];
  
  // BMI-based recommendations
  if (bmi > 30) {
    recommendations.push('Cardio exercises - 30 minutes daily walking');
    recommendations.push('Low-impact activities - Swimming, cycling');
    recommendations.push('Gradual intensity increase');
  } else if (bmi > 25) {
    recommendations.push('Moderate cardio - Brisk walking, jogging');
    recommendations.push('Strength training - 2-3 times per week');
  }
  
  // Heart disease recommendations
  if (predictions.heart_disease.risk_level === 'High') {
    recommendations.push('Light walking - Start with 10-15 minutes');
    recommendations.push('Avoid high-intensity exercises initially');
    recommendations.push('Consult cardiologist before starting program');
  } else if (predictions.heart_disease.risk_level === 'Medium') {
    recommendations.push('Moderate aerobic exercise - 150 min/week');
    recommendations.push('Heart rate monitoring during exercise');
  }
  
  // Diabetes recommendations
  if (predictions.diabetes.risk_level === 'High') {
    recommendations.push('Post-meal walks - 15 minutes after meals');
    recommendations.push('Resistance training - Improve insulin sensitivity');
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Regular physical activity - 30 min/day');
    recommendations.push('Mix of cardio and strength training');
    recommendations.push('Yoga or stretching for flexibility');
  }
  
  return recommendations;
}

/**
 * Get department recommendation based on risk levels
 */
function getDepartmentRecommendation(predictions, vitals) {
  const diabetesRisk = predictions.diabetes.risk_level;
  const heartRisk = predictions.heart_disease.risk_level;
  
  if (diabetesRisk === 'High') {
    return {
      department: 'Endocrinology',
      priority: 'High',
      reason: 'High diabetes risk detected'
    };
  }
  
  if (heartRisk === 'High') {
    return {
      department: 'Cardiology',
      priority: 'High',
      reason: 'High heart disease risk detected'
    };
  }
  
  if (vitals.BloodPressure > 140) {
    return {
      department: 'General Medicine',
      priority: 'Medium',
      reason: 'Elevated blood pressure'
    };
  }
  
  if (diabetesRisk === 'Medium' || heartRisk === 'Medium') {
    return {
      department: 'General Medicine',
      priority: 'Medium',
      reason: 'Moderate health risks detected'
    };
  }
  
  return {
    department: 'General Medicine',
    priority: 'Low',
    reason: 'Routine checkup recommended'
  };
}

/**
 * Generate medication reminders
 */
function generateReminders(predictions) {
  const reminders = [];
  
  if (predictions.diabetes.risk_level === 'High') {
    reminders.push({
      type: 'medication',
      title: 'Blood Sugar Check',
      frequency: 'Daily',
      time: '08:00 AM'
    });
  }
  
  if (predictions.heart_disease.risk_level === 'High') {
    reminders.push({
      type: 'medication',
      title: 'Blood Pressure Check',
      frequency: 'Daily',
      time: '09:00 AM'
    });
  }
  
  reminders.push({
    type: 'diet',
    title: 'Healthy Breakfast',
    frequency: 'Daily',
    time: '08:30 AM'
  });
  
  reminders.push({
    type: 'exercise',
    title: 'Morning Walk',
    frequency: 'Daily',
    time: '06:00 AM'
  });
  
  return reminders;
}

module.exports = {
  calculateHealthScore,
  getDietRecommendations,
  getExerciseRecommendations,
  getDepartmentRecommendation,
  generateReminders
};
