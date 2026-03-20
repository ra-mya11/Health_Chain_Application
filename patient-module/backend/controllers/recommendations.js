// Calculate Digital Health Score
function calculateHealthScore(predictions, vitals) {
  // Clinical Score (0-100)
  let clinicalScore = 100;
  
  if (vitals.bmi > 30) clinicalScore -= 20;
  else if (vitals.bmi > 25) clinicalScore -= 10;
  
  if (vitals.bloodPressure > 140) clinicalScore -= 20;
  else if (vitals.bloodPressure > 120) clinicalScore -= 10;
  
  if (vitals.cholesterol > 240) clinicalScore -= 20;
  else if (vitals.cholesterol > 200) clinicalScore -= 10;
  
  // AI Risk Score (0-100)
  const diabetesRisk = predictions.diabetes.probability;
  const heartRisk = predictions.heart_disease.probability;
  const avgRisk = (diabetesRisk + heartRisk) / 2;
  const aiRiskScore = (1 - avgRisk) * 100;
  
  // Lifestyle Score (default 70)
  const lifestyleScore = 70;
  
  // Overall Score
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

// Get diet plan based on predictions
function getDietPlan(predictions) {
  const plan = [];
  
  if (predictions.diabetes.risk_level === 'High') {
    plan.push('Low sugar diet - Avoid refined carbohydrates');
    plan.push('High fiber foods - Whole grains, vegetables, legumes');
    plan.push('Lean proteins - Fish, chicken, tofu');
    plan.push('Avoid sugary drinks and processed foods');
    plan.push('Eat small frequent meals');
  } else if (predictions.diabetes.risk_level === 'Medium') {
    plan.push('Moderate carbohydrate intake');
    plan.push('Include complex carbohydrates');
    plan.push('Monitor sugar intake');
  }
  
  if (predictions.heart_disease.risk_level === 'High') {
    plan.push('Low cholesterol diet - Reduce saturated fats');
    plan.push('Omega-3 rich foods - Salmon, walnuts, flaxseeds');
    plan.push('Reduce sodium - Less than 2300mg/day');
    plan.push('Increase fruits and vegetables');
    plan.push('Use olive oil instead of butter');
  } else if (predictions.heart_disease.risk_level === 'Medium') {
    plan.push('Heart-healthy fats - Avocados, nuts');
    plan.push('Limit red meat consumption');
  }
  
  if (plan.length === 0) {
    plan.push('Balanced diet with variety of nutrients');
    plan.push('Stay hydrated - 8 glasses of water daily');
    plan.push('Include fruits and vegetables in every meal');
    plan.push('Limit processed foods');
  }
  
  return plan;
}

// Get exercise plan based on predictions and BMI
function getExercisePlan(predictions, bmi) {
  const plan = [];
  
  if (bmi > 30) {
    plan.push('Cardio exercises - 30 minutes daily walking');
    plan.push('Low-impact activities - Swimming, cycling');
    plan.push('Start slow and gradually increase intensity');
    plan.push('Aim for 150 minutes of moderate activity per week');
  } else if (bmi > 25) {
    plan.push('Moderate cardio - Brisk walking, jogging');
    plan.push('Strength training - 2-3 times per week');
    plan.push('Flexibility exercises - Yoga or stretching');
  }
  
  if (predictions.heart_disease.risk_level === 'High') {
    plan.push('Light walking - Start with 10-15 minutes');
    plan.push('Avoid high-intensity exercises initially');
    plan.push('Consult cardiologist before starting program');
    plan.push('Monitor heart rate during exercise');
  } else if (predictions.heart_disease.risk_level === 'Medium') {
    plan.push('Moderate aerobic exercise - 150 min/week');
    plan.push('Heart rate monitoring recommended');
  }
  
  if (predictions.diabetes.risk_level === 'High') {
    plan.push('Post-meal walks - 15 minutes after meals');
    plan.push('Resistance training - Improves insulin sensitivity');
    plan.push('Avoid exercising on empty stomach');
  }
  
  if (plan.length === 0) {
    plan.push('Regular physical activity - 30 min/day');
    plan.push('Mix of cardio and strength training');
    plan.push('Yoga or stretching for flexibility');
    plan.push('Stay active throughout the day');
  }
  
  return plan;
}

// Get reminders based on health status
function getReminders(predictions) {
  const reminders = [];
  
  if (predictions.diabetes.risk_level === 'High') {
    reminders.push({
      type: 'medication',
      title: 'Blood Sugar Check',
      description: 'Check your blood sugar levels',
      frequency: 'Daily',
      time: '08:00 AM'
    });
  }
  
  if (predictions.heart_disease.risk_level === 'High') {
    reminders.push({
      type: 'medication',
      title: 'Blood Pressure Check',
      description: 'Monitor your blood pressure',
      frequency: 'Daily',
      time: '09:00 AM'
    });
  }
  
  reminders.push({
    type: 'diet',
    title: 'Healthy Breakfast',
    description: 'Follow your diet plan',
    frequency: 'Daily',
    time: '08:30 AM'
  });
  
  reminders.push({
    type: 'exercise',
    title: 'Morning Exercise',
    description: 'Complete your exercise routine',
    frequency: 'Daily',
    time: '06:00 AM'
  });
  
  reminders.push({
    type: 'hydration',
    title: 'Drink Water',
    description: 'Stay hydrated throughout the day',
    frequency: 'Every 2 hours',
    time: '10:00 AM'
  });
  
  return reminders;
}

module.exports = {
  calculateHealthScore,
  getDietPlan,
  getExercisePlan,
  getReminders
};
