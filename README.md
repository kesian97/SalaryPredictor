## Predicting Developer Salaries Using Stack Overflow Survey 2024 Data

### 1. Problem Statement

Predicting developer salaries is crucial for understanding market trends, salary expectations, and workforce planning. Using the 2024 Stack Overflow Developer Survey data, we aim to build a machine learning model that accurately predicts salaries based on various factors such as experience, education, job role, and location. The model will be evaluated using MSE,MAE and R Squared. Finally, we will deploy the model as a FastAPI-based web service.

### 2. Objectives
- Build a predictive model to estimate developer salaries using survey data.
- Evaluate model performance using standard classification/regression metrics while minimizing bias and variance for robust predictions.
- Deploy the model as an API using FastAPI for real-time predictions.

### 3. Dataset

The dataset is a publicly available dataset from Stack Overflow Developer Survey 2024. It contains **65,438** rows and 114 columns, this includes programming languages, years of experience, education,
job role, location, and salary just to mention a few, in the CSV format (Structured data).

### 4. Model Selection & Approach
- Data Pre-processing: Handle missing values, encode categorical variables and normalize
numerical features
- Feature Engineering: Select key features impacting salary prediction and create new relevant features (e.g., experience brackets)
- Models to be used: Linear Regression (for initial baseline), Random Forest Regression and Gradient Boosting (XG Boost)
- Evaluation Metrics:
    - Regression Metrics: Mean Absolute Error (MAE), Mean Squared Error (MSE), RSquared
    - Bias-Variance trade-off analysis
