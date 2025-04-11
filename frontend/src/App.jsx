// frontend/src/App.jsx (adjust imports/syntax slightly if using .js)
import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // You can add styling here

function App() {
  // State for form inputs
  const [formData, setFormData] = useState({
    Country: 'United States of America', // Default values
    EdLevel: 'Bachelor’s degree (B.A., B.S., B.Eng., etc.)',
    Age_group: '25-34 years old',
    DevType: 'Developer, full-stack',
    RemoteWork: 'Hybrid (some remote, some in-person)',    
    MainBranch: 'I am a developer by profession',
    YearsCodePro: '5',
    // Add other features as needed
  });

  // State for prediction result and loading/error status
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Define Options for Select Dropdowns ---
  // *** IMPORTANT: Use the exact string values that your cleaning functions
  // *** and label encoders expect BEFORE encoding. Get these from your notebook analysis.
  const countryOptions = [
    'United States of America', 'Germany', 'United Kingdom of Great Britain and Northern Ireland',
    'Ukraine', 'India', 'France', 'Canada', 'Brazil', 'Spain', 'Italy', 'Netherlands', 'Australia'
    // Add ALL countries kept after filtering 'Other' in the notebook
  ];
  const edLevelOptions = [ // Use values AFTER cleaning in the notebook
    'Bachelor’s degree', 'Master’s degree', 'Post grad', 'Less than a Bachelors'
  ];
  const devTypeOptions = [ // Get unique values from df['DevType'].unique() in notebook
    'Developer, full-stack', 'Developer, back-end', 'Developer, front-end',
    'Developer, mobile', 'Developer, embedded applications or devices',
    'Engineering manager', 'Data scientist or machine learning specialist',
    'DevOps specialist', /* Add ALL relevant types */
    'Other (please specify):' // Include if kept, otherwise remove
  ];
  const remoteWorkOptions = [ // From df['RemoteWork'].unique()
    'Hybrid (some remote, some in-person)', 'Fully remote', 'In-person'
  ];
  const ageGroupOptions = [ // From df['Age_group'].unique()
    '25-34 years old', '35-44 years old', '18-24 years old', '45-54 years old',
    '55-64 years old', 'Under 18 years old', '65 years or older', 'Prefer not to say'
  ];
   const mainBranchOptions = [ // Use values AFTER cleaning
    'Full time developer', /* Add other cleaned options if any */
   ];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default page reload
    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      // Send POST request to FastAPI backend
      const response = await axios.post('http://localhost:8000/predict', formData);

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.predicted_salary !== undefined) {
        setPrediction(response.data.predicted_salary);
      } else {
         setError("Received an unexpected response from the server.");
      }

    } catch (err) {
      console.error("API Error:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to get prediction. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (

     <div className="container mt-5">
      <div className="p-4 border rounded shadow">
      <h1 className="mb-4">Developer Salary Predictor</h1>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label className="form-label">Country</label>
            <select name="Country" value={formData.Country} onChange={handleChange} className="form-select">
              {countryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Education Level</label>
            <select name="EdLevel" value={formData.EdLevel} onChange={handleChange} className="form-select">
              {edLevelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Years of Experience</label>
            <input type="text" name="YearsCodePro" value={formData.YearsCodePro} onChange={handleChange} className="form-control" placeholder="e.g., 5 or Less than 1 year" />
          </div>

          <div className="col-md-6">
            <label className="form-label">Developer Type</label>
            <select name="DevType" value={formData.DevType} onChange={handleChange} className="form-select">
              {devTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Remote Work</label>
            <select name="RemoteWork" value={formData.RemoteWork} onChange={handleChange} className="form-select">
              {remoteWorkOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Age Group</label>
            <select name="Age_group" value={formData.Age_group} onChange={handleChange} className="form-select">
              {ageGroupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Primary Role</label>
            <select name="MainBranch" value={formData.MainBranch} onChange={handleChange} className="form-select">
              {mainBranchOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Predicting...' : 'Predict Salary'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-danger mt-3">Error: {error}</div>}
      {prediction !== null && (
        <div className="alert alert-success mt-3">
          <h4>Predicted Annual Salary (USD):</h4>
          <p>${prediction.toLocaleString()}</p>
        </div>
      )}
    </div>

    // <div className="App">
    //   <h1>Developer Salary Predictor</h1>
    //   <form onSubmit={handleSubmit}>
    //     {/* Create form fields for each input */}

    //     <label>Country:</label>
    //     <select name="Country" value={formData.Country} onChange={handleChange}>
    //       {countryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    //     </select>

    //     <label>Education Level:</label>
    //     <select name="EdLevel" value={formData.EdLevel} onChange={handleChange}>
    //        {edLevelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    //     </select>

    //     <label>Years Professional Experience:</label>
    //     {/* Use text input, backend handles cleaning */}
    //     <input
    //       type="text"
    //       name="YearsCodePro"
    //       value={formData.YearsCodePro}
    //       onChange={handleChange}
    //       placeholder="e.g., 5, Less than 1 year, More than 50 years"
    //     />

    //      <label>Developer Type:</label>
    //     <select name="DevType" value={formData.DevType} onChange={handleChange}>
    //        {devTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    //     </select>

    //      <label>Remote Work Status:</label>
    //     <select name="RemoteWork" value={formData.RemoteWork} onChange={handleChange}>
    //        {remoteWorkOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    //     </select>

    //      <label>Age Group:</label>
    //     <select name="Age_group" value={formData.Age_group} onChange={handleChange}>
    //        {ageGroupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    //     </select>

    //      <label>Primary Role:</label>
    //     <select name="MainBranch" value={formData.MainBranch} onChange={handleChange}>
    //        {mainBranchOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    //     </select>

    //     {/* Add other input fields similarly */}

    //     <button type="submit" disabled={loading}>
    //       {loading ? 'Predicting...' : 'Predict Salary'}
    //     </button>
    //   </form>

    //   {/* Display Prediction or Error */}
    //   {error && <p className="error">Error: {error}</p>}
    //   {prediction !== null && (
    //     <div className="prediction">
    //       <h2>Predicted Annual Salary (USD):</h2>
    //       <p>${prediction.toLocaleString()}</p>
    //     </div>
    //   )}
    // </div>
  );
}

export default App;
