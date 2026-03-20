from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import shap
from typing import Dict, List
import os

app = FastAPI(title="Healthcare AI Prediction Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models")

try:
    diabetes_model = joblib.load(os.path.join(MODEL_PATH, "diabetes_model.pkl"))
    diabetes_scaler = joblib.load(os.path.join(MODEL_PATH, "diabetes_scaler.pkl"))
    heart_model = joblib.load(os.path.join(MODEL_PATH, "heart_model.pkl"))
    heart_scaler = joblib.load(os.path.join(MODEL_PATH, "heart_scaler.pkl"))
    print("✓ Models loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")
    print(f"Looking in: {MODEL_PATH}")
    print("Please run train_models.py first")

# Request models
class DiabetesInput(BaseModel):
    Glucose: float = Field(..., ge=0, le=300, description="Glucose level (mg/dL)")
    BMI: float = Field(..., ge=10, le=60, description="Body Mass Index")
    Age: int = Field(..., ge=1, le=120, description="Age in years")
    BloodPressure: float = Field(..., ge=40, le=200, description="Blood Pressure (mmHg)")
    Insulin: float = Field(default=0, ge=0, le=500, description="Insulin level")
    SkinThickness: float = Field(default=20, ge=0, le=100, description="Skin thickness (mm)")
    DiabetesPedigreeFunction: float = Field(default=0.5, ge=0, le=3, description="Diabetes pedigree")
    Pregnancies: int = Field(default=0, ge=0, le=20, description="Number of pregnancies")

class HeartDiseaseInput(BaseModel):
    Age: int = Field(..., ge=1, le=120, description="Age in years")
    Sex: int = Field(..., ge=0, le=1, description="Sex (0=Female, 1=Male)")
    ChestPainType: int = Field(..., ge=0, le=3, description="Chest pain type")
    RestingBP: float = Field(..., ge=40, le=200, description="Resting blood pressure")
    Cholesterol: float = Field(..., ge=100, le=500, description="Cholesterol level")
    FastingBS: int = Field(..., ge=0, le=1, description="Fasting blood sugar > 120 mg/dl")
    MaxHR: float = Field(..., ge=60, le=220, description="Maximum heart rate")
    ExerciseAngina: int = Field(..., ge=0, le=1, description="Exercise induced angina")
    Oldpeak: float = Field(..., ge=0, le=10, description="ST depression")
    ST_Slope: int = Field(..., ge=0, le=2, description="Slope of peak exercise ST")

class CombinedInput(BaseModel):
    # Common fields
    Age: int = Field(..., ge=1, le=120)
    BMI: float = Field(..., ge=10, le=60)
    BloodPressure: float = Field(..., ge=40, le=200)
    Cholesterol: float = Field(..., ge=100, le=500)
    Glucose: float = Field(..., ge=0, le=300)
    
    # Optional fields
    Sex: int = Field(default=0, ge=0, le=1)
    Insulin: float = Field(default=0, ge=0, le=500)
    SkinThickness: float = Field(default=20, ge=0, le=100)
    DiabetesPedigreeFunction: float = Field(default=0.5, ge=0, le=3)
    Pregnancies: int = Field(default=0, ge=0, le=20)
    ChestPainType: int = Field(default=0, ge=0, le=3)
    FastingBS: int = Field(default=0, ge=0, le=1)
    MaxHR: float = Field(default=150, ge=60, le=220)
    ExerciseAngina: int = Field(default=0, ge=0, le=1)
    Oldpeak: float = Field(default=0, ge=0, le=10)
    ST_Slope: int = Field(default=1, ge=0, le=2)

# Helper functions
def get_risk_level(probability: float) -> str:
    if probability < 0.3:
        return "Low"
    elif probability < 0.6:
        return "Medium"
    else:
        return "High"

def calculate_shap_values(model, scaler, input_data, feature_names):
    """Calculate SHAP values for explainability"""
    try:
        scaled_data = scaler.transform([input_data])
        explainer = shap.TreeExplainer(model) if hasattr(model, 'estimators_') else shap.LinearExplainer(model, scaled_data)
        shap_values = explainer.shap_values(scaled_data)
        
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        
        feature_contributions = {
            feature_names[i]: float(shap_values[0][i])
            for i in range(len(feature_names))
        }
        
        return dict(sorted(feature_contributions.items(), key=lambda x: abs(x[1]), reverse=True))
    except Exception as e:
        return {"error": str(e)}

# API Endpoints
@app.get("/")
def root():
    return {
        "service": "Healthcare AI Prediction Service",
        "version": "1.0.0",
        "endpoints": ["/predict", "/predict/diabetes", "/predict/heart", "/health"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "models_loaded": True}

@app.get("/symptoms")
def get_symptoms():
    """Return list of available symptoms for the symptom checker"""
    symptoms = [
        "fever", "cough", "fatigue", "shortness_of_breath", "chest_pain",
        "headache", "nausea", "vomiting", "diarrhea", "abdominal_pain",
        "back_pain", "joint_pain", "muscle_pain", "dizziness", "sweating",
        "chills", "loss_of_appetite", "weight_loss", "swelling", "rash",
        "sore_throat", "runny_nose", "blurred_vision", "frequent_urination",
        "excessive_thirst", "palpitations", "numbness", "anxiety", "insomnia"
    ]
    return {"symptoms": symptoms}

@app.post("/predict-disease")
def predict_disease_from_symptoms(data: dict):
    """Predict disease from symptoms"""
    age = data.get("age", 30)
    gender = data.get("gender", "male")
    symptoms = data.get("symptoms", {})

    active = [s for s, v in symptoms.items() if v > 0]
    score = sum(symptoms.values())

    # Simple rule-based prediction
    if any(s in active for s in ["chest_pain", "palpitations", "shortness_of_breath"]):
        disease, dept = "Possible Cardiac Issue", "Cardiology"
    elif any(s in active for s in ["frequent_urination", "excessive_thirst", "weight_loss"]):
        disease, dept = "Possible Diabetes", "Endocrinology"
    elif any(s in active for s in ["fever", "cough", "sore_throat", "runny_nose"]):
        disease, dept = "Respiratory Infection", "General Medicine"
    elif any(s in active for s in ["headache", "dizziness", "numbness", "blurred_vision"]):
        disease, dept = "Neurological Concern", "Neurology"
    elif any(s in active for s in ["abdominal_pain", "nausea", "vomiting", "diarrhea"]):
        disease, dept = "Gastrointestinal Issue", "General Medicine"
    else:
        disease, dept = "General Health Concern", "General Medicine"

    risk = "High" if score > 6 else "Medium" if score > 3 else "Low"
    confidence = min(95, 50 + int(score * 5))

    explanation = {s: round(symptoms[s] / 3, 2) for s in active}

    return {
        "prediction": {
            "predicted_disease": disease,
            "confidence": confidence,
            "risk_level": risk,
            "recommended_department": dept,
            "explanation": explanation
        }
    }

@app.post("/predict")
def predict_combined(data: CombinedInput):
    """Combined prediction for both diabetes and heart disease"""
    
    # Diabetes prediction
    diabetes_features = [
        data.Glucose, data.BMI, data.Age, data.BloodPressure,
        data.Insulin, data.SkinThickness, data.DiabetesPedigreeFunction, data.Pregnancies
    ]
    diabetes_scaled = diabetes_scaler.transform([diabetes_features])
    diabetes_prob = diabetes_model.predict_proba(diabetes_scaled)[0][1]
    diabetes_prediction = int(diabetes_prob > 0.5)
    
    # Heart disease prediction
    heart_features = [
        data.Age, data.Sex, data.ChestPainType, data.BloodPressure,
        data.Cholesterol, data.FastingBS, data.MaxHR, data.ExerciseAngina,
        data.Oldpeak, data.ST_Slope
    ]
    heart_scaled = heart_scaler.transform([heart_features])
    heart_prob = heart_model.predict_proba(heart_scaled)[0][1]
    heart_prediction = int(heart_prob > 0.5)
    
    # SHAP explanations
    diabetes_feature_names = ['Glucose', 'BMI', 'Age', 'BloodPressure', 'Insulin', 
                              'SkinThickness', 'DiabetesPedigreeFunction', 'Pregnancies']
    heart_feature_names = ['Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol',
                          'FastingBS', 'MaxHR', 'ExerciseAngina', 'Oldpeak', 'ST_Slope']
    
    diabetes_shap = calculate_shap_values(diabetes_model, diabetes_scaler, 
                                         diabetes_features, diabetes_feature_names)
    heart_shap = calculate_shap_values(heart_model, heart_scaler, 
                                       heart_features, heart_feature_names)
    
    # Department recommendation
    department = "General Medicine"
    if diabetes_prob > 0.6:
        department = "Endocrinology"
    elif heart_prob > 0.6:
        department = "Cardiology"
    elif data.BloodPressure > 140:
        department = "General Medicine"
    
    return {
        "diabetes": {
            "prediction": diabetes_prediction,
            "probability": round(float(diabetes_prob), 4),
            "risk_level": get_risk_level(diabetes_prob),
            "feature_importance": diabetes_shap
        },
        "heart_disease": {
            "prediction": heart_prediction,
            "probability": round(float(heart_prob), 4),
            "risk_level": get_risk_level(heart_prob),
            "feature_importance": heart_shap
        },
        "recommendations": {
            "department": department,
            "priority": "High" if (diabetes_prob > 0.6 or heart_prob > 0.6) else "Normal"
        }
    }

@app.post("/predict/diabetes")
def predict_diabetes(data: DiabetesInput):
    """Diabetes prediction endpoint"""
    features = [
        data.Glucose, data.BMI, data.Age, data.BloodPressure,
        data.Insulin, data.SkinThickness, data.DiabetesPedigreeFunction, data.Pregnancies
    ]
    
    scaled_features = diabetes_scaler.transform([features])
    prediction = diabetes_model.predict(scaled_features)[0]
    probability = diabetes_model.predict_proba(scaled_features)[0][1]
    
    feature_names = ['Glucose', 'BMI', 'Age', 'BloodPressure', 'Insulin', 
                     'SkinThickness', 'DiabetesPedigreeFunction', 'Pregnancies']
    shap_values = calculate_shap_values(diabetes_model, diabetes_scaler, features, feature_names)
    
    return {
        "prediction": int(prediction),
        "probability": round(float(probability), 4),
        "risk_level": get_risk_level(probability),
        "feature_importance": shap_values,
        "recommendation": "Consult Endocrinologist" if probability > 0.6 else "Regular checkup recommended"
    }

@app.post("/predict/heart")
def predict_heart_disease(data: HeartDiseaseInput):
    """Heart disease prediction endpoint"""
    features = [
        data.Age, data.Sex, data.ChestPainType, data.RestingBP,
        data.Cholesterol, data.FastingBS, data.MaxHR, data.ExerciseAngina,
        data.Oldpeak, data.ST_Slope
    ]
    
    scaled_features = heart_scaler.transform([features])
    prediction = heart_model.predict(scaled_features)[0]
    probability = heart_model.predict_proba(scaled_features)[0][1]
    
    feature_names = ['Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol',
                     'FastingBS', 'MaxHR', 'ExerciseAngina', 'Oldpeak', 'ST_Slope']
    shap_values = calculate_shap_values(heart_model, heart_scaler, features, feature_names)
    
    return {
        "prediction": int(prediction),
        "probability": round(float(probability), 4),
        "risk_level": get_risk_level(probability),
        "feature_importance": shap_values,
        "recommendation": "Consult Cardiologist immediately" if probability > 0.6 else "Maintain healthy lifestyle"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
