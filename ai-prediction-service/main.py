from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import joblib
import numpy as np
import json
import os
from datetime import datetime
import sys

app = FastAPI(title="Disease Prediction API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define symptoms and disease-department mapping
SYMPTOMS = [
    'fever', 'headache', 'fatigue', 'chest_pain', 'shortness_of_breath',
    'cough', 'nausea', 'vomiting', 'abdominal_pain', 'dizziness',
    'frequent_urination', 'excessive_thirst', 'joint_pain', 'skin_rash',
    'vision_problems', 'back_pain', 'sore_throat', 'body_ache'
]

DISEASE_DEPARTMENT_MAPPING = {
    'heart_disease': 'Cardiology',
    'migraine': 'Neurology',
    'arthritis': 'Orthopedics',
    'pneumonia': 'Pulmonology',
    'diabetes': 'Endocrinology',
    'skin_infection': 'Dermatology',
    'gastritis': 'Gastroenterology',
    'kidney_disease': 'Nephrology',
    'ear_infection': 'ENT',
    'asthma': 'Pulmonology',
    'anxiety': 'Psychiatry',
    'hypertension': 'Cardiology',
    'common_cold': 'General Medicine',
    'flu': 'General Medicine',
    'thyroid_disorder': 'Endocrinology',
    'urinary_tract_infection': 'Nephrology',
    'depression': 'Psychiatry',
    'acne': 'Dermatology'
}

# Define request/response models
class SymptomInput(BaseModel):
    age: int
    gender: str  # 'male', 'female', 'other'
    symptoms: Dict[str, float]  # symptom_name: severity (0-3)

class PredictionResponse(BaseModel):
    predicted_disease: str
    confidence: float
    risk_level: str  # Low, Medium, High
    recommended_department: str
    explanation: Dict[str, float]  # feature importance explanation
    timestamp: str

# Load or create dummy model
MODEL_PATH = 'disease_prediction_model.pkl'

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("✓ Disease prediction model loaded")
    else:
        print("⚠ Model not found. Using prediction rules.")
        model = None
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Helper functions
def get_risk_level(confidence: float) -> str:
    """Determine risk level based on confidence"""
    if confidence >= 75:
        return "High"
    elif confidence >= 50:
        return "Medium"
    else:
        return "Low"

def prepare_features(age: int, gender: str, symptoms: Dict[str, float]) -> np.ndarray:
    """Prepare input features for the model"""
    feature_vector = []
    
    # Add symptom features (0-3 scale)
    for symptom in SYMPTOMS:
        severity = symptoms.get(symptom, 0)
        feature_vector.append(max(0, min(3, severity)))  # Clamp between 0 and 3
    
    # Add age
    feature_vector.append(age)
    
    # Add gender encoding
    if gender.lower() == 'male':
        feature_vector.append(1)
        feature_vector.append(0)
    elif gender.lower() == 'female':
        feature_vector.append(0)
        feature_vector.append(1)
    else:
        feature_vector.append(0)
        feature_vector.append(0)
    
    return np.array([feature_vector])

def predict_by_rules(age: int, gender: str, symptoms: Dict[str, float]) -> tuple:
    """Rule-based prediction when ML model is not available"""
    relevant_symptoms = {k: v for k, v in symptoms.items() if v > 0}
    
    # Score diseases based on symptoms
    disease_scores = {}
    
    # Cardiology conditions
    if relevant_symptoms.get('chest_pain', 0) >= 2 or (relevant_symptoms.get('shortness_of_breath', 0) >= 2 and age > 40):
        disease_scores['heart_disease'] = 0.85
    if relevant_symptoms.get('headache', 0) >= 2 and relevant_symptoms.get('dizziness', 0) >= 1:
        disease_scores['hypertension'] = 0.70
    
    # Neurology
    if relevant_symptoms.get('headache', 0) >= 3 and relevant_symptoms.get('nausea', 0) >= 1:
        disease_scores['migraine'] = 0.80
    
    # Orthopedics
    if relevant_symptoms.get('joint_pain', 0) >= 2 and relevant_symptoms.get('back_pain', 0) >= 2:
        disease_scores['arthritis'] = 0.75
    if relevant_symptoms.get('back_pain', 0) >= 2:
        disease_scores['arthritis'] = max(disease_scores.get('arthritis', 0), 0.65)
    
    # Pulmonology/Respiratory
    if relevant_symptoms.get('cough', 0) >= 2 and relevant_symptoms.get('shortness_of_breath', 0) >= 2:
        disease_scores['pneumonia'] = 0.85
    if relevant_symptoms.get('cough', 0) >= 2 and relevant_symptoms.get('shortness_of_breath', 0) >= 1:
        disease_scores['asthma'] = 0.75
    
    # Endocrinology
    if relevant_symptoms.get('frequent_urination', 0) >= 2 and relevant_symptoms.get('excessive_thirst', 0) >= 2:
        disease_scores['diabetes'] = 0.80
    if relevant_symptoms.get('excessive_thirst', 0) >= 2:
        disease_scores['diabetes'] = max(disease_scores.get('diabetes', 0), 0.60)
    
    # Dermatology
    if relevant_symptoms.get('skin_rash', 0) >= 2:
        disease_scores['skin_infection'] = 0.75
    
    # Gastroenterology
    if relevant_symptoms.get('abdominal_pain', 0) >= 2 and relevant_symptoms.get('nausea', 0) >= 1:
        disease_scores['gastritis'] = 0.70
    
    # ENT
    if relevant_symptoms.get('sore_throat', 0) >= 2:
        disease_scores['ear_infection'] = 0.65
    
    # Common illnesses
    if relevant_symptoms.get('cough', 0) >= 1 and relevant_symptoms.get('sore_throat', 0) >= 1:
        disease_scores['common_cold'] = max(disease_scores.get('common_cold', 0), 0.60)
    
    if relevant_symptoms.get('fever', 0) >= 2 and (relevant_symptoms.get('cough', 0) >= 1 or relevant_symptoms.get('body_ache', 0) >= 1):
        disease_scores['flu'] = max(disease_scores.get('flu', 0), 0.70)
    
    # Default to general medicine if no strong match
    if not disease_scores:
        disease_scores['general_health_checkup'] = 0.50
    
    # Get highest scoring disease
    predicted_disease = max(disease_scores, key=disease_scores.get)
    confidence = disease_scores[predicted_disease]
    
    return predicted_disease, confidence

def get_explanation(symptoms: Dict[str, float], top_n: int = 5) -> Dict[str, float]:
    """Generate explanation showing which symptoms contributed most"""
    relevant_symptoms = {k: v for k, v in symptoms.items() if v > 0}
    
    # Sort by severity
    sorted_symptoms = dict(sorted(relevant_symptoms.items(), key=lambda x: x[1], reverse=True)[:top_n])
    
    # Normalize to 0-1 range
    if sorted_symptoms:
        max_val = max(sorted_symptoms.values())
        return {k: round(v / max_val, 2) for k, v in sorted_symptoms.items()}
    return {}

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Disease Prediction API",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict-disease", response_model=PredictionResponse)
async def predict_disease(input_data: SymptomInput):
    """
    Predict disease based on symptoms, age, and gender
    
    Example input:
    {
        "age": 45,
        "gender": "male",
        "symptoms": {
            "chest_pain": 2,
            "shortness_of_breath": 2,
            "fatigue": 3,
            "headache": 1
        }
    }
    """
    try:
        # Validate input
        if input_data.age < 0 or input_data.age > 150:
            raise ValueError("Age must be between 0 and 150")
        
        if input_data.gender.lower() not in ['male', 'female', 'other']:
            raise ValueError("Gender must be 'male', 'female', or 'other'")
        
        # Get prediction
        if model is not None:
            X_features = prepare_features(input_data.age, input_data.gender, input_data.symptoms)
            prediction = model.predict(X_features)[0]
            probabilities = model.predict_proba(X_features)[0]
            confidence = float(np.max(probabilities)) * 100
        else:
            prediction, confidence = predict_by_rules(input_data.age, input_data.gender, input_data.symptoms)
            confidence = confidence * 100
        
        # Get department
        department = DISEASE_DEPARTMENT_MAPPING.get(prediction, "General Medicine")
        
        # Get explanation
        explanation = get_explanation(input_data.symptoms)
        
        # Determine risk level
        risk_level = get_risk_level(confidence)
        
        return PredictionResponse(
            predicted_disease=prediction.replace('_', ' ').title(),
            confidence=round(confidence, 2),
            risk_level=risk_level,
            recommended_department=department,
            explanation=explanation,
            timestamp=datetime.now().isoformat()
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/symptoms")
async def get_available_symptoms():
    """Get list of available symptoms"""
    return {
        "symptoms": SYMPTOMS,
        "severity_scale": {
            "0": "None",
            "1": "Mild",
            "2": "Moderate",
            "3": "Severe"
        }
    }

@app.get("/departments")
async def get_departments():
    """Get all available departments and their disease mappings"""
    departments = {}
    for disease, dept in DISEASE_DEPARTMENT_MAPPING.items():
        if dept not in departments:
            departments[dept] = []
        departments[dept].append(disease.replace('_', ' ').title())
    
    return {"departments": departments}

@app.get("/model-info")
async def get_model_info():
    """Get information about the prediction system"""
    return {
        "system_type": "Symptom-Based Disease Prediction",
        "prediction_method": "ML Model" if model else "Rule-Based",
        "features": len(SYMPTOMS) + 3,  # symptoms + age + gender
        "symptom_count": len(SYMPTOMS),
        "diseases": list(set(DISEASE_DEPARTMENT_MAPPING.values())),
        "timestamp": datetime.now().isoformat()
    }

class PatientData(BaseModel):
    age: int
    bp_systolic: int
    bp_diastolic: int
    sugar_level: float
    bmi: float
    cholesterol: int
    symptoms: List[str] = []

class PredictionResponse(BaseModel):
    diabetes_risk: float
    heart_disease_risk: float
    hypertension_risk: float
    diabetes_prediction: str
    heart_disease_prediction: str
    hypertension_prediction: str
    overall_risk: str
    recommendations: List[str]

@app.get("/")
def root():
    return {"message": "AI Disease Prediction API", "status": "running"}

@app.post("/predict", response_model=PredictionResponse)
def predict_disease(patient: PatientData):
    try:
        # Prepare features
        features = np.array([[
            patient.age,
            patient.bp_systolic,
            patient.bp_diastolic,
            patient.sugar_level,
            patient.bmi,
            patient.cholesterol
        ]])
        
        # Diabetes prediction
        features_diabetes = diabetes_scaler.transform(features)
        diabetes_prob = diabetes_model.predict_proba(features_diabetes)[0][1]
        diabetes_pred = "High Risk" if diabetes_prob > 0.5 else "Low Risk"
        
        # Heart disease prediction
        features_heart = heart_scaler.transform(features)
        heart_prob = heart_model.predict_proba(features_heart)[0][1]
        heart_pred = "High Risk" if heart_prob > 0.5 else "Low Risk"
        
        # Hypertension prediction
        features_hypertension = hypertension_scaler.transform(features)
        hypertension_prob = hypertension_model.predict_proba(features_hypertension)[0][1]
        hypertension_pred = "High Risk" if hypertension_prob > 0.5 else "Low Risk"
        
        # Overall risk
        avg_risk = (diabetes_prob + heart_prob + hypertension_prob) / 3
        if avg_risk > 0.7:
            overall = "High Risk"
        elif avg_risk > 0.4:
            overall = "Moderate Risk"
        else:
            overall = "Low Risk"
        
        # Recommendations
        recommendations = []
        if diabetes_prob > 0.5:
            recommendations.append("Monitor blood sugar levels regularly")
            recommendations.append("Maintain healthy diet low in sugar")
        if heart_prob > 0.5:
            recommendations.append("Reduce cholesterol intake")
            recommendations.append("Regular cardiovascular exercise")
        if hypertension_prob > 0.5:
            recommendations.append("Reduce sodium intake")
            recommendations.append("Monitor blood pressure daily")
        if patient.bmi > 30:
            recommendations.append("Weight management recommended")
        if not recommendations:
            recommendations.append("Maintain healthy lifestyle")
            recommendations.append("Regular health checkups")
        
        return PredictionResponse(
            diabetes_risk=round(diabetes_prob * 100, 2),
            heart_disease_risk=round(heart_prob * 100, 2),
            hypertension_risk=round(hypertension_prob * 100, 2),
            diabetes_prediction=diabetes_pred,
            heart_disease_prediction=heart_pred,
            hypertension_prediction=hypertension_pred,
            overall_risk=overall,
            recommendations=recommendations
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "models_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
