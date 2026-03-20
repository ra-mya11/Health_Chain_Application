import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import json
from datetime import datetime

# Define symptoms and departments mapping
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
    'acne': 'Dermatology',
    'migraine_with_aura': 'Neurology',
    'inflammatory_bowel_disease': 'Gastroenterology'
}

# Create synthetic training dataset
def create_training_dataset():
    """Generate synthetic training data for disease prediction"""
    np.random.seed(42)
    
    # Define disease patterns
    disease_patterns = {
        'heart_disease': {
            'symptoms': {'chest_pain': 2.5, 'shortness_of_breath': 2.0, 'fatigue': 2.0, 'body_ache': 1.5},
            'age_range': (45, 80),
            'gender': 'male'
        },
        'migraine': {
            'symptoms': {'headache': 3.0, 'vision_problems': 1.5, 'nausea': 1.0, 'fatigue': 1.5},
            'age_range': (20, 60),
            'gender': 'any'
        },
        'arthritis': {
            'symptoms': {'joint_pain': 2.5, 'back_pain': 2.0, 'fatigue': 1.0, 'body_ache': 2.0},
            'age_range': (40, 80),
            'gender': 'any'
        },
        'pneumonia': {
            'symptoms': {'cough': 3.0, 'chest_pain': 1.5, 'fever': 2.5, 'shortness_of_breath': 2.5, 'fatigue': 2.0},
            'age_range': (0, 100),
            'gender': 'any'
        },
        'diabetes': {
            'symptoms': {'frequent_urination': 2.5, 'excessive_thirst': 2.5, 'fatigue': 2.0, 'vision_problems': 1.0},
            'age_range': (30, 80),
            'gender': 'any'
        },
        'skin_infection': {
            'symptoms': {'skin_rash': 3.0, 'fever': 1.0, 'itching': 2.0},
            'age_range': (0, 100),
            'gender': 'any'
        },
        'gastritis': {
            'symptoms': {'abdominal_pain': 2.5, 'nausea': 2.0, 'vomiting': 1.5, 'fatigue': 1.0},
            'age_range': (20, 70),
            'gender': 'any'
        },
        'common_cold': {
            'symptoms': {'cough': 2.0, 'fever': 1.5, 'sore_throat': 2.5, 'headache': 1.0, 'fatigue': 1.0},
            'age_range': (0, 100),
            'gender': 'any'
        },
        'asthma': {
            'symptoms': {'shortness_of_breath': 2.5, 'cough': 2.0, 'chest_pain': 1.0, 'fatigue': 1.0},
            'age_range': (0, 80),
            'gender': 'any'
        },
        'hypertension': {
            'symptoms': {'headache': 1.5, 'dizziness': 1.5, 'fatigue': 1.0, 'chest_pain': 1.0},
            'age_range': (40, 80),
            'gender': 'any'
        }
    }
    
    samples = []
    labels = []
    
    # Generate samples for each disease
    for disease, pattern in disease_patterns.items():
        for _ in range(100):
            sample = {symptom: 0 for symptom in SYMPTOMS}
            sample['age'] = np.random.randint(pattern['age_range'][0], pattern['age_range'][1])
            sample['gender_male'] = 1 if (pattern['gender'] == 'male' or (pattern['gender'] == 'any' and np.random.random() > 0.5)) else 0
            sample['gender_female'] = 1 - sample['gender_male']
            
            # Add disease-specific symptoms
            for symptom, base_severity in pattern['symptoms'].items():
                if symptom in SYMPTOMS:
                    severity = base_severity + np.random.normal(0, 0.5)
                    sample[symptom] = max(0, min(3, severity))
            
            samples.append(sample)
            labels.append(disease)
    
    return pd.DataFrame(samples), labels

# Train the model
def train_model():
    """Train Random Forest model on disease prediction"""
    print("Creating training dataset...")
    X, y = create_training_dataset()
    
    print(f"Dataset shape: {X.shape}")
    print(f"Classes: {set(y)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=15)
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    
    print(f"Training accuracy: {train_score:.4f}")
    print(f"Testing accuracy: {test_score:.4f}")
    
    # Save model
    joblib.dump(model, 'disease_prediction_model.pkl')
    print("Model saved as 'disease_prediction_model.pkl'")
    
    return model

# Get feature importance
def get_feature_importance(model, feature_names):
    """Extract feature importance from model"""
    importance = model.feature_importances_
    features_importance = list(zip(feature_names, importance))
    features_importance.sort(key=lambda x: x[1], reverse=True)
    return features_importance

if __name__ == '__main__':
    model = train_model()
    feature_names = SYMPTOMS + ['age', 'gender_male', 'gender_female']
    importance = get_feature_importance(model, feature_names)
    print("\nTop 10 important features:")
    for feature, imp in importance[:10]:
        print(f"{feature}: {imp:.4f}")
