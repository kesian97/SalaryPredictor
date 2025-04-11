# backend/main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib  # Or import pickle if you used that
import numpy as np
import traceback
import os

# --- Configuration ---
MODEL_PATH = "best_model.pkl"
ENCODERS_PATH = "label_encoders.pkl"

# --- Load Model and Encoders ---
# Load only once when the application starts
try:
    model = joblib.load(MODEL_PATH)  # Or pickle.load(open(MODEL_PATH, 'rb'))
    label_encoders = joblib.load(
        ENCODERS_PATH
    )  # Or pickle.load(open(ENCODERS_PATH, 'rb'))
    print("Model and encoders loaded successfully.")
    # Get the expected feature order from the encoders (or model if available)
    # Assuming label_encoders keys preserve the order used during training
    # EXPECTED_FEATURES = list(label_encoders.keys()) + [
    #     "YearsCodePro"
    # ]  # Add numerical features not in encoders

    EXPECTED_FEATURES = list(label_encoders.keys()) # Add numerical features not in encoders
    # Ensure the order matches exactly how the model was trained!
    # You might need to manually define this list based on X.columns before training
    # Example: EXPECTED_FEATURES = ['Country', 'EdLevel', 'YearsCodePro', 'DevType', 'RemoteWork', 'Age_group', 'MainBranch']
    print(f"Expected feature order: {EXPECTED_FEATURES}")

except FileNotFoundError:
    print(
        f"Error: Model or encoders file not found. Make sure '{MODEL_PATH}' and '{ENCODERS_PATH}' are in the backend directory."
    )
    model = None
    label_encoders = None
    EXPECTED_FEATURES = []
except Exception as e:
    print(f"Error loading model or encoders: {e}")
    model = None
    label_encoders = None
    EXPECTED_FEATURES = []


# --- Define Input Data Model ---
# Use the exact feature names your model expects
class SalaryInput(BaseModel):
    Country: str
    EdLevel: str
    Age_group: str
    DevType: str
    RemoteWork: str
    MainBranch: str
    YearsCodePro: str  # Receive as string to handle "Less than 1 year", etc.
    # Add any other features your model was trained on


# --- Define Helper Functions (Mirroring Notebook Preprocessing) ---
def clean_experience(x):
    if x == "More than 50 years":
        return 50.0
    if x == "Less than 1 year":
        return 0.5
    try:
        return float(x)
    except ValueError:
        # Handle unexpected values if necessary, e.g., return median or raise error
        return 0.0  # Or np.nan, but ensure model handles NaNs if you allow them


def clean_education(x):
    # if "Bachelor’s degree" in x:
    #     return "Bachelor’s degree"
    # if "Master’s degree" in x:
    #     return "Master’s degree"
    # if "Professional degree" in x or "Other doctoral" in x or "Associate degree" in x:
    #     return "Post grad"  # Or adjust based on your notebook's logic
    # # Add logic for 'Something else', 'Primary/elementary school', 'Secondary school'
    # # based on how you grouped them in the notebook
    # if "Something else" in x or "Primary/elementary" in x or "Secondary school" in x:
    #     return "Less than a Bachelors"

    """
    simplify the categories in the 'EdLevel' column into broader groups:
    'Bachelor’s degree', 'Master’s degree', 'Post grad', or 'Less than a Bachelors'.
    """

    if x == "Bachelor’s degree (B.A., B.S., B.Eng., etc.)" in x:
        return "Bachelor’s degree"
    if x == "Master’s degree (M.A., M.S., M.Eng., MBA, etc.)" in x:
        return "Master’s degree"
    if x == "Professional degree (JD, MD, Ph.D, Ed.D, etc.)" in x:
        return "Post grad"
    else:
        return "Less than a Bachelors"

    return x  # Return original if no match (or handle explicitly)


def clean_MainBranch(x):
    if "I am a developer by profession" in x:
        return "Full time developer"
    # Add logic for other branches if they exist after filtering
    # Example:
    # elif 'I am not primarily a developer' in x:
    #    return 'Part time developer'
    return x  # Or a default category


# --- Create FastAPI App ---
app = FastAPI(title="Salary Predictor API")

# --- Add CORS Middleware ---
# Allows requests from your React frontend (adjust origins if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
    ],  # Add React dev server port
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# --- Define Prediction Endpoint ---
@app.post("/predict")
async def predict_salary(data: SalaryInput):
    if not model or not label_encoders:
        return {"error": "Model or encoders not loaded. Check backend logs."}

    try:
        # 1. Convert input to DataFrame
        input_df = pd.DataFrame([data.dict()])
        print(f"Received input: {input_df.iloc[0].to_dict()}")  # Log received data

        # 2. Apply Preprocessing (Mirroring the notebook *exactly*)
        # Apply cleaning functions BEFORE encoding
        input_df["YearsCodePro"] = input_df["YearsCodePro"].apply(clean_experience)
        input_df["EdLevel"] = input_df["EdLevel"].apply(clean_education)
        input_df["MainBranch"] = input_df["MainBranch"].apply(clean_MainBranch)
        # Add cleaning for other columns if needed (e.g., DevType, RemoteWork, Age_group)

        # Apply Label Encoding
        for col, le in label_encoders.items():
            if col in input_df.columns:
                # Handle unseen labels during prediction
                input_df[col] = input_df[col].apply(
                    lambda x: le.transform([x])[0] if x in le.classes_ else -1
                )  # Assign -1 or handle differently
                # Check for -1 and decide how to handle (e.g., error, default value)
                if (input_df[col] == -1).any():
                    print(
                        f"Warning: Unseen label detected in column '{col}': {input_df[input_df[col] == -1][col].iloc[0]}"
                    )
                    # Option 1: Return error
                    # return {"error": f"Unseen value '{input_df[input_df[col] == -1][col].iloc[0]}' in column '{col}'"}
                    # Option 2: Impute (e.g., with mode, but requires saving mode)
                    # input_df.loc[input_df[col] == -1, col] = default_encoded_value
                    # For now, let's allow prediction but be aware
            else:
                print(
                    f"Warning: Column '{col}' expected by encoder but not found in input."
                )

        # 3. Ensure Column Order
        # Reorder columns to match the order the model was trained on
        try:
            input_df = input_df[EXPECTED_FEATURES]
            print(f"Data after preprocessing & reordering:\n{input_df}")
        except KeyError as e:
            return {"error": f"Missing expected feature after preprocessing: {e}"}

        # 4. Make Prediction
        prediction = model.predict(input_df)
        predicted_salary = prediction[0]  # Get the single prediction value

        # 5. Return Prediction
        return {"predicted_salary": round(predicted_salary, 2)}

    except Exception as e:
        print(f"Error during prediction: {e}")  # Log the error
        # Consider more specific error handling
        return {"error": f"An error occurred during prediction: {str(e)}"}


# --- Root Endpoint (Optional) ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Salary Predictor API"}


# --- Run the App (for local development) ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
