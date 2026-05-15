import React, { useState } from 'react';
import { Camera, Upload, Users, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    const form = new FormData();
    form.append('image', file);
    form.append('classId', 'CSE-A'); // Hardcoded for now

    try {
      const response = await api.post('/attendance/capture', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Capture</h1>
          <p className="text-slate-500 text-sm">Mark attendance via image upload</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center min-h-[300px] border-dashed">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-10 h-10 text-purple-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Upload Image</h2>
          <p className="text-slate-500 text-center mb-6">Upload a classroom photo to detect faces</p>
          <label className="cursor-pointer px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
            Choose File
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">Results {loading && '...'}</h2>
        </div>
        
        {error && <p className="text-red-500">{error}</p>}
        
        {results ? (
          <div>
            <p className="mb-4 text-slate-700">Total: {results.summary.total} | Present: <span className="text-green-600 font-bold">{results.summary.present}</span> | Absent: <span className="text-red-600 font-bold">{results.summary.absent}</span></p>
            <p className="text-sm text-slate-500">Attendance saved successfully!</p>
          </div>
        ) : (
          <div className="flex justify-center items-center py-12 text-slate-400">
            {loading ? "Processing AI recognition..." : "Upload an image to see attendance results"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
