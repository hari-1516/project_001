import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Save, UserPlus, CheckCircle } from 'lucide-react';
import api from '../api';

const StudentRegistration = () => {
  const webcamRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    department: '',
    year: '1',
    section: 'A'
  });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (images.length < 5) {
      setImages(prev => [...prev, imageSrc]);
    }
  }, [webcamRef, images]);

  const clearImages = () => setImages([]);

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const file = dataURLtoFile(images[0], `${formData.usn}.jpg`);
      const form = new FormData();
      form.append('name', formData.name);
      form.append('usn', formData.usn);
      form.append('department', formData.department);
      form.append('image', file);

      await api.post('/students', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(true);
      setFormData({ name: '', usn: '', department: 'CSE', year: '1', section: 'A' });
      setImages([]);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Register Student</h1>
        <p className="text-slate-500 text-sm">Capture multiple face angles for accurate AI recognition.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-6">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-800">Student Details</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">USN / Roll No</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.usn}
                onChange={e => setFormData({...formData, usn: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              >
                <option value="CSE">Computer Science</option>
                <option value="ECE">Electronics</option>
                <option value="ME">Mechanical</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: e.target.value})}
                >
                  {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={formData.section}
                  onChange={e => setFormData({...formData, section: e.target.value})}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full mt-4 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl transition-colors"
              disabled={images.length === 0}
            >
              <Save className="w-4 h-4" />
              <span>Register Student</span>
            </button>
          </form>
        </div>

        {/* Webcam Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Face Capture</h2>
            <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video relative flex items-center justify-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover"
              />
              {/* Overlay guides */}
              <div className="absolute inset-0 border-2 border-white/20 m-12 rounded-[100px] pointer-events-none"></div>
            </div>
            
            <div className="mt-6 flex justify-center space-x-4">
              <button 
                onClick={capture}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30 transition-all"
              >
                <Camera className="w-5 h-5" />
                <span>Capture Angle ({images.length}/5)</span>
              </button>
              <button 
                onClick={clearImages}
                className="flex items-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Captured Thumbnails */}
          {images.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Captured Angles</h3>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden border-2 border-purple-100 flex-shrink-0">
                    <img src={img} alt={`angle-${idx}`} className="w-full h-full object-cover" />
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
