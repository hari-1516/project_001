import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Save, UserPlus, CheckCircle, AlertCircle, Upload, X, Image } from 'lucide-react';
import api from '../api';

const StudentRegistration = () => {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);         // base64 captured images
  const [uploadedFile, setUploadedFile] = useState(null); // file upload fallback
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [webcamError, setWebcamError] = useState(false);
  const [useUpload, setUseUpload] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    department: 'CSE',
    year: '1',
    section: 'A'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Capture from webcam
  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc && images.length < 5) {
      setImages(prev => [...prev, imageSrc]);
    }
  }, [webcamRef, images]);

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  // Convert base64 to File
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let n = bstr.length - 1; n >= 0; n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const hasImage = images.length > 0 || uploadedFile !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!hasImage) {
      setError('Please capture or upload at least one face photo.');
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('usn', formData.usn);
      form.append('department', formData.department);
      form.append('year', formData.year);
      form.append('section', formData.section);

      // Prefer webcam capture, fallback to file upload
      if (images.length > 0) {
        const file = dataURLtoFile(images[0], `${formData.usn}.jpg`);
        form.append('image', file);
      } else if (uploadedFile) {
        form.append('image', uploadedFile);
      }

      const response = await api.post('/students', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(response.data.message);
      setFormData({ name: '', usn: '', department: 'CSE', year: '1', section: 'A' });
      setImages([]);
      setUploadedFile(null);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Register Student</h1>
        <p className="text-slate-500 text-sm mt-1">Add students with face photos for AI attendance recognition.</p>
      </div>

      {/* Global Feedback */}
      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-2xl">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-green-600" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Form ── */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-800">Student Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text" name="name" required
                value={formData.name} onChange={handleChange}
                placeholder="e.g. Harish S"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
              />
            </div>

            {/* USN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">USN / Roll No *</label>
              <input
                type="text" name="usn" required
                value={formData.usn} onChange={handleChange}
                placeholder="e.g. 1RV22CS001"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm uppercase"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
              <select
                name="department" value={formData.department} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
              >
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="ME">Mechanical (ME)</option>
                <option value="CV">Civil (CV)</option>
                <option value="ISE">Information Science (ISE)</option>
              </select>
            </div>

            {/* Year & Section */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <select
                  name="year" value={formData.year} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                >
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <select
                  name="section" value={formData.section} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                >
                  {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !hasImage}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Register Student</span>
                </>
              )}
            </button>

            {!hasImage && (
              <p className="text-xs text-center text-slate-400">📸 Capture or upload a face photo to enable registration</p>
            )}
          </form>
        </div>

        {/* ── Right: Camera / Upload ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Toggle: Webcam vs Upload */}
          <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
            <button
              type="button"
              onClick={() => setUseUpload(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                !useUpload ? 'bg-white shadow text-purple-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera className="w-4 h-4" /> Webcam
            </button>
            <button
              type="button"
              onClick={() => setUseUpload(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                useUpload ? 'bg-white shadow text-purple-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload Photo
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">

            {/* WEBCAM MODE */}
            {!useUpload && (
              <>
                <h2 className="text-base font-semibold text-slate-800 mb-4">
                  Face Capture — {images.length}/5 angles captured
                </h2>

                {!webcamError ? (
                  <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video relative">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: 'user' }}
                      className="w-full h-full object-cover"
                      onUserMediaError={() => setWebcamError(true)}
                    />
                    {/* Face guide oval */}
                    <div className="absolute inset-0 border-2 border-white/20 m-12 rounded-[100px] pointer-events-none" />
                    <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                      {images.length}/5 captured
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-100 aspect-video flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-12 h-12 mb-2" />
                    <p className="text-sm font-medium">Camera access denied</p>
                    <button onClick={() => setUseUpload(true)} className="mt-2 text-purple-600 text-sm underline">
                      Use file upload instead
                    </button>
                  </div>
                )}

                {webcamError && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Camera access denied. <button onClick={() => setUseUpload(true)} className="underline ml-1">Use file upload</button>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={capture}
                    disabled={images.length >= 5 || !!webcamError}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture {images.length > 0 ? 'Another' : 'Photo'}</span>
                  </button>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Retake</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* FILE UPLOAD MODE */}
            {useUpload && (
              <>
                <h2 className="text-base font-semibold text-slate-800 mb-4">Upload Face Photo</h2>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!uploadedFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-purple-400 hover:bg-purple-50 transition-all text-slate-400 hover:text-purple-600"
                  >
                    <Image className="w-12 h-12" />
                    <div className="text-center">
                      <p className="font-medium">Click to upload photo</p>
                      <p className="text-sm mt-1">JPG, PNG up to 10MB. Clear front-facing photo.</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100">
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt="Uploaded"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Photo ready
                    </div>
                  </div>
                )}

                {!uploadedFile && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" /> Choose File
                  </button>
                )}
              </>
            )}
          </div>

          {/* Captured thumbnails (webcam mode) */}
          {images.length > 0 && !useUpload && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Captured Angles ({images.length}/5)</h3>
              <div className="flex gap-3 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-100 group">
                    <img src={img} alt={`angle-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/50 text-white hidden group-hover:flex items-center justify-center rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;
