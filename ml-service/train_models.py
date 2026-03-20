import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os

# Create models directory if not exists
os.makedirs('models', exist_ok=True)

# ==================== DIABETES PREDICTION MODEL ====================
print("=" * 60)
print("Training Diabetes Prediction Model")
print("=" * 60)

# Generate synthetic diabetes dataset
np.random.seed(42)
n_samples = 1000

diabetes_data = pd.DataFrame({
    'Glucose': np.random.randint(70, 200, n_samples),
    'BMI': np.random.uniform(18, 45, n_samples),
    'Age': np.random.randint(20, 80, n_samples),
    'BloodPressure': np.random.randint(60, 140, n_samples),
    'Insulin': np.random.randint(0, 300, n_samples),
    'SkinThickness': np.random.randint(10, 60, n_samples),
    'DiabetesPedigreeFunction': np.random.uniform(0.1, 2.5, n_samples),
    'Pregnancies': np.random.randint(0, 15, n_samples)
})

# Create target based on risk factors
diabetes_data['Outcome'] = (
    (diabetes_data['Glucose'] > 140) | 
    (diabetes_data['BMI'] > 30) | 
    (diabetes_data['Age'] > 50)
).astype(int)

# Save dataset
diabetes_data.to_csv('data/diabetes_data.csv', index=False)
print(f"Dataset saved: {len(diabetes_data)} samples")

# Prepare features and target
X_diabetes = diabetes_data.drop('Outcome', axis=1)
y_diabetes = diabetes_data['Outcome']

# Split data
X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(
    X_diabetes, y_diabetes, test_size=0.2, random_state=42
)

# Scale features
scaler_diabetes = StandardScaler()
X_train_d_scaled = scaler_diabetes.fit_transform(X_train_d)
X_test_d_scaled = scaler_diabetes.transform(X_test_d)

# Train Random Forest model
rf_diabetes = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)
rf_diabetes.fit(X_train_d_scaled, y_train_d)

# Evaluate
y_pred_d = rf_diabetes.predict(X_test_d_scaled)
accuracy_d = accuracy_score(y_test_d, y_pred_d)

print(f"\nDiabetes Model Accuracy: {accuracy_d:.4f}")
print("\nClassification Report:")
print(classification_report(y_test_d, y_pred_d))

# Feature importance
feature_importance_d = pd.DataFrame({
    'feature': X_diabetes.columns,
    'importance': rf_diabetes.feature_importances_
}).sort_values('importance', ascending=False)

print("\nFeature Importance:")
print(feature_importance_d)

# Save model and scaler
joblib.dump(rf_diabetes, 'models/diabetes_model.pkl')
joblib.dump(scaler_diabetes, 'models/diabetes_scaler.pkl')
print("\n✓ Diabetes model saved successfully")

# ==================== HEART DISEASE PREDICTION MODEL ====================
print("\n" + "=" * 60)
print("Training Heart Disease Prediction Model")
print("=" * 60)

# Generate synthetic heart disease dataset
heart_data = pd.DataFrame({
    'Age': np.random.randint(30, 80, n_samples),
    'Sex': np.random.randint(0, 2, n_samples),
    'ChestPainType': np.random.randint(0, 4, n_samples),
    'RestingBP': np.random.randint(90, 180, n_samples),
    'Cholesterol': np.random.randint(150, 350, n_samples),
    'FastingBS': np.random.randint(0, 2, n_samples),
    'MaxHR': np.random.randint(80, 200, n_samples),
    'ExerciseAngina': np.random.randint(0, 2, n_samples),
    'Oldpeak': np.random.uniform(0, 6, n_samples),
    'ST_Slope': np.random.randint(0, 3, n_samples)
})

# Create target based on risk factors
heart_data['HeartDisease'] = (
    (heart_data['Age'] > 55) | 
    (heart_data['Cholesterol'] > 240) | 
    (heart_data['RestingBP'] > 140) |
    (heart_data['ExerciseAngina'] == 1)
).astype(int)

# Save dataset
heart_data.to_csv('data/heart_data.csv', index=False)
print(f"Dataset saved: {len(heart_data)} samples")

# Prepare features and target
X_heart = heart_data.drop('HeartDisease', axis=1)
y_heart = heart_data['HeartDisease']

# Split data
X_train_h, X_test_h, y_train_h, y_test_h = train_test_split(
    X_heart, y_heart, test_size=0.2, random_state=42
)

# Scale features
scaler_heart = StandardScaler()
X_train_h_scaled = scaler_heart.fit_transform(X_train_h)
X_test_h_scaled = scaler_heart.transform(X_test_h)

# Train Logistic Regression model
lr_heart = LogisticRegression(
    max_iter=1000,
    random_state=42,
    solver='lbfgs'
)
lr_heart.fit(X_train_h_scaled, y_train_h)

# Evaluate
y_pred_h = lr_heart.predict(X_test_h_scaled)
accuracy_h = accuracy_score(y_test_h, y_pred_h)

print(f"\nHeart Disease Model Accuracy: {accuracy_h:.4f}")
print("\nClassification Report:")
print(classification_report(y_test_h, y_pred_h))

# Save model and scaler
joblib.dump(lr_heart, 'models/heart_model.pkl')
joblib.dump(scaler_heart, 'models/heart_scaler.pkl')
print("\n✓ Heart disease model saved successfully")

# ==================== SUMMARY ====================
print("\n" + "=" * 60)
print("TRAINING SUMMARY")
print("=" * 60)
print(f"✓ Diabetes Model Accuracy: {accuracy_d:.2%}")
print(f"✓ Heart Disease Model Accuracy: {accuracy_h:.2%}")
print(f"✓ Models saved in 'models/' directory")
print(f"✓ Datasets saved in 'data/' directory")
print("=" * 60)
