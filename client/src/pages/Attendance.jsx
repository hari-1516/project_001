import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, Users, AlertCircle } from 'lucide-react';
import api from '../api';
import { dataURLtoFile } from '../utils/helpers';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [classId, setClassId] = useState('CSE-A');
  const [mode, setMode] = useState('upload');
  const [cameraError, setCameraError] = useState(false);
  const webcamRef = useRef(null);

  const submitImage = async (file) => {
    setLoading(true);
    setError('');
    const form = new FormData();
    form.append('image', file);
    form.append('classId', classId.trim().toUpperCase());

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    submitImage(file);
  };

  const handleWebcamCapture = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      setError('Camera is not ready. Please allow camera access and try again.');
      return;
    }

    submitImage(dataURLtoFile(screenshot, `attendance-${Date.now()}.jpg`));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Capture</h1>
          <p className="text-slate-500 text-sm">Mark attendance via image upload or live camera</p>
        </div>
        <input
          type="text"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="CSE-A"
        />
      </div>

      <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${mode === 'upload' ? 'bg-white shadow text-purple-700' : 'text-slate-500'}`}
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${mode === 'camera' ? 'bg-white shadow text-purple-700' : 'text-slate-500'}`}
        >
          <Camera className="w-4 h-4" />
          Live Camera
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Upload Card */}
        {mode === 'upload' ? (
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
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video">
              {!cameraError ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                  }}
                  onUserMediaError={(err) => {
                    console.error('Camera error:', err);
                    setCameraError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Camera className="w-12 h-12 mb-2" />
                  <p className="text-sm font-medium">Camera access denied</p>
                  <button onClick={() => setMode('upload')} className="mt-2 text-purple-600 text-sm underline">
                    Use file upload instead
                  </button>
                </div>
              )}
            </div>
            {!cameraError && (
              <button
                type="button"
                onClick={handleWebcamCapture}
                disabled={loading}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Capture Attendance
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">Results {loading && '...'}</h2>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {results ? (
          <div>
            <p className="mb-2 text-slate-700">Total: {results.summary.total} | Present: <span className="text-green-600 font-bold">{results.summary.present}</span> | Absent: <span className="text-red-600 font-bold">{results.summary.absent}</span></p>
            <p className="mb-2 text-sm text-slate-500">Detected faces: {results.summary.detectedFaces} | Unknown faces: {results.summary.unknownFaces} | AI: {results.summary.aiAvailable ? 'Online' : 'Offline'}</p>
            {results.summary.liveness && (
              <p className={`mb-4 text-sm ${results.summary.liveness.is_live ? 'text-green-600' : 'text-amber-600'}`}>
                Liveness: {results.summary.liveness.reason} ({Math.round((results.summary.liveness.confidence || 0) * 100)}%)
              </p>
            )}

            {results.absentStudents && results.absentStudents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-red-600 mb-2">Absent Students ({results.absentStudents.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {results.absentStudents.map((student) => (
                    <span key={student.usn} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">
                      {student.name}
                      <span className="text-red-400">({student.usn})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">Attendance saved successfully!</p>
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
