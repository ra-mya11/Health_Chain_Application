import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import warnings
warnings.filterwarnings('ignore')

# Generate synthetic training data
np.random.seed(42)
n_samples = 5000

# Generate features
age = np.random.randint(20, 80, n_samples)
bp_systolic = np.random.randint(90, 180, n_samples)
bp_diastolic = np.random.randint(60, 120, n_samples)
sugar_level = np.random.randint(70, 300, n_samples)
bmi = np.random.uniform(15, 45, n_samples)
cholesterol = np.random.randint(120, 300, n_samples)

# Create DataFrame
data = pd.DataFrame({
    'age': age,
    'bp_systolic': bp_systolic,
    'bp_diastolic': bp_diastolic,
    'sugar_level': sugar_level,
    'bmi': bmi,
    'cholesterol': cholesterol
})

# Generate labels based on medical thresholds
data['diabetes'] = ((data['sugar_level'] > 140) & (data['bmi'] > 30)).astype(int)
data['heart_disease'] = ((data['cholesterol'] > 240) & (data['bp_systolic'] > 140) & (data['age'] > 50)).astype(int)
data['hypertension'] = ((data['bp_systolic'] > 140) | (data['bp_diastolic'] > 90)).astype(int)

# Features
X = data[['age', 'bp_systolic', 'bp_diastolic', 'sugar_level', 'bmi', 'cholesterol']]

# Train Diabetes Model
print("Training Diabetes Model...")
y_diabetes = data['diabetes']
X_train, X_test, y_train, y_test = train_test_split(X, y_diabetes, test_size=0.2, random_state=42)

scaler_diabetes = StandardScaler()
X_train_scaled = scaler_diabetes.fit_transform(X_train)
X_test_scaled = scaler_diabetes.transform(X_test)

diabetes_model = RandomForestClassifier(n_estimators=100, random_state=42)
diabetes_model.fit(X_train_scaled, y_train)
diabetes_score = diabetes_model.score(X_test_scaled, y_test)
print(f"Diabetes Model Accuracy: {diabetes_score:.2%}")

# Train Heart Disease Model
print("Training Heart Disease Model...")
y_heart = data['heart_disease']
X_train, X_test, y_train, y_test = train_test_split(X, y_heart, test_size=0.2, random_state=42)

scaler_heart = StandardScaler()
X_train_scaled = scaler_heart.fit_transform(X_train)
X_test_scaled = scaler_heart.transform(X_test)

heart_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
heart_model.fit(X_train_scaled, y_train)
heart_score = heart_model.score(X_test_scaled, y_test)
print(f"Heart Disease Model Accuracy: {heart_score:.2%}")

# Train Hypertension Model
print("Training Hypertension Model...")
y_hypertension = data['hypertension']
X_train, X_test, y_train, y_test = train_test_split(X, y_hypertension, test_size=0.2, random_state=42)

scaler_hypertension = StandardScaler()
X_train_scaled = scaler_hypertension.fit_transform(X_train)
X_test_scaled = scaler_hypertension.transform(X_test)

hypertension_model = RandomForestClassifier(n_estimators=100, random_state=42)
hypertension_model.fit(X_train_scaled, y_train)
hypertension_score = hypertension_model.score(X_test_scaled, y_test)
print(f"Hypertension Model Accuracy: {hypertension_score:.2%}")

# Save models and scalers
joblib.dump(diabetes_model, 'models/diabetes_model.pkl')
joblib.dump(scaler_diabetes, 'models/diabetes_scaler.pkl')
joblib.dump(heart_model, 'models/heart_model.pkl')
joblib.dump(scaler_heart, 'models/heart_scaler.pkl')
joblib.dump(hypertension_model, 'models/hypertension_model.pkl')
joblib.dump(scaler_hypertension, 'models/hypertension_scaler.pkl')

print("\n✓ All models saved successfully!")
print("Models saved in 'models/' directory")
