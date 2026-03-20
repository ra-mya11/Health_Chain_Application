from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import numpy as np
from datetime import datetime

app = FastAPI(title="Disease Prediction API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define symptoms
SYMPTOMS = [
    'fever', 'headache', 'fatigue', 'chest_pain', 'shortness_of_breath',
    'cough', 'nausea', 'vomiting', 'abdominal_pain', 'dizziness',
    'frequent_urination', 'excessive_thirst', 'joint_pain', 'skin_rash',
    'vision_problems', 'back_pain', 'sore_throat', 'body_ache'
]

# Disease to Department Mapping
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

# Request/Response Models
class SymptomInput(BaseModel):
    age: int
    gender: str
    symptoms: Dict[str, float]

class PredictionResponse(BaseModel):
    predicted_disease: str
    confidence: float
    risk_level: str
    recommended_department: str
    explanation: Dict[str, float]
    timestamp: str

# Helper Functions
def predict_by_rules(age: int, gender: str, symptoms: Dict[str, float]) -> tuple:
    """Rule-based disease prediction"""
    relevant_symptoms = {k: v for k, v in symptoms.items() if v > 0}
    
    disease_scores = {}
    
    # Cardiology
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
    
    # Pulmonology
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
    
    # Default
    if not disease_scores:
        disease_scores['general_checkup'] = 0.50
    
    predicted_disease = max(disease_scores, key=disease_scores.get)
    confidence = disease_scores[predicted_disease]
    
    return predicted_disease, confidence

def get_risk_level(confidence: float) -> str:
    """Determine risk level"""
    if confidence >= 0.75:
        return "High"
    elif confidence >= 0.50:
        return "Medium"
    else:
        return "Low"

def get_explanation(symptoms: Dict[str, float], top_n: int = 5) -> Dict[str, float]:
    """Get explanation for prediction"""
    relevant_symptoms = {k: v for k, v in symptoms.items() if v > 0}
    sorted_symptoms = dict(sorted(relevant_symptoms.items(), key=lambda x: x[1], reverse=True)[:top_n])
    
    if sorted_symptoms:
        max_val = max(sorted_symptoms.values())
        return {k: round(v / max_val, 2) for k, v in sorted_symptoms.items()}
    return {}

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "Disease Prediction API",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict-disease", response_model=PredictionResponse)
async def predict_disease(input_data: SymptomInput):
    """Predict disease based on symptoms"""
    try:
        # Validate input
        if input_data.age < 0 or input_data.age > 150:
            raise ValueError("Age must be between 0 and 150")
        
        if input_data.gender.lower() not in ['male', 'female', 'other']:
            raise ValueError("Gender must be 'male', 'female', or 'other'")
        
        # Get prediction
        prediction, confidence = predict_by_rules(input_data.age, input_data.gender, input_data.symptoms)
        confidence_percent = confidence * 100
        
        # Get department
        department = DISEASE_DEPARTMENT_MAPPING.get(prediction, "General Medicine")
        
        # Get explanation
        explanation = get_explanation(input_data.symptoms)
        
        # Determine risk level
        risk_level = get_risk_level(confidence)
        
        return PredictionResponse(
            predicted_disease=prediction.replace('_', ' ').title(),
            confidence=round(confidence_percent, 2),
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
    """Get available symptoms"""
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
    """Get available departments"""
    departments = {}
    for disease, dept in DISEASE_DEPARTMENT_MAPPING.items():
        if dept not in departments:
            departments[dept] = []
        departments[dept].append(disease.replace('_', ' ').title())
    
    return {"departments": departments}

@app.get("/model-info")
async def get_model_info():
    """Get model information"""
    return {
        "system_type": "Symptom-Based Disease Prediction",
        "prediction_method": "Rule-Based AI",
        "symptom_count": len(SYMPTOMS),
        "diseases": list(set(DISEASE_DEPARTMENT_MAPPING.values())),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
