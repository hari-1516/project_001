import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, Users } from 'lucide-react';
import api from '../api';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [classId, setClassId] = useState('CSE-A');
  const [mode, setMode] = useState('upload');
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

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const bytes = new Uint8Array(bstr.length);

    for (let i = 0; i < bstr.length; i++) {
      bytes[i] = bstr.charCodeAt(i);
    }

    return new File([bytes], filename, { type: mime });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Capture</h1>
          <p className="text-slate-500 text-sm">Mark attendance via image upload</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                onUserMedia={() => console.log('Camera started')}
                onUserMediaError={(err) => console.error('Camera error:', err)}
              />
            </div>
            <button
              type="button"
              onClick={handleWebcamCapture}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              Capture Attendance
            </button>
          </div>
        )}
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
            <p className="mb-2 text-slate-700">Total: {results.summary.total} | Present: <span className="text-green-600 font-bold">{results.summary.present}</span> | Absent: <span className="text-red-600 font-bold">{results.summary.absent}</span></p>
            <p className="mb-2 text-sm text-slate-500">Detected faces: {results.summary.detectedFaces} | Unknown faces: {results.summary.unknownFaces} | AI: {results.summary.aiAvailable ? 'Online' : 'Offline'}</p>
            {results.summary.liveness && (
              <p className={`mb-4 text-sm ${results.summary.liveness.is_live ? 'text-green-600' : 'text-amber-600'}`}>
                Liveness: {results.summary.liveness.reason} ({Math.round((results.summary.liveness.confidence || 0) * 100)}%)
              </p>
            )}
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
