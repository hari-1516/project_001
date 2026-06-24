import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Radio, Users, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const LiveAttendance = () => {
  const webcamRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const { token } = useAuth();

  const [connected, setConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [classId, setClassId] = useState('CSE-A');
  const [latestResult, setLatestResult] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState(new Map());

  // Connect to WebSocket
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(`${serverUrl}/live-attendance`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('Live attendance connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Live attendance disconnected');
    });

    socket.on('results', (data) => {
      setLatestResult(data);

      // Track recognized students
      if (data.recognizedStudents) {
        setRecognizedStudents(prev => {
          const updated = new Map(prev);
          data.recognizedStudents.forEach(s => {
            if (!updated.has(s.usn)) {
              updated.set(s.usn, { ...s, firstSeen: data.timestamp, lastSeen: data.timestamp, count: 1 });
            } else {
              const existing = updated.get(s.usn);
              updated.set(s.usn, { ...existing, lastSeen: data.timestamp, count: existing.count + 1 });
            }
          });
          return updated;
        });
      }
    });

    socket.on('error', (err) => {
      console.error('Live attendance error:', err);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Capture and send frames
  const captureFrame = useCallback(() => {
    if (!webcamRef.current || !socketRef.current?.connected) return;

    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot) {
      socketRef.current.emit('frame', {
        image: screenshot,
        classId: classId.trim().toUpperCase(),
      });
    }
  }, [classId]);

  const startStreaming = () => {
    setStreaming(true);
    setRecognizedStudents(new Map());
    intervalRef.current = setInterval(captureFrame, 2000); // Capture every 2 seconds
  };

  const stopStreaming = () => {
    setStreaming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const recognizedList = Array.from(recognizedStudents.values())
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Radio className="w-6 h-6 text-purple-600" />
            Live Attendance
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time face recognition via webcam stream</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="CSE-A"
          />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video relative">
              {!cameraError ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                  onUserMediaError={() => setCameraError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Camera className="w-12 h-12 mb-2" />
                  <p className="text-sm font-medium">Camera access denied</p>
                </div>
              )}

              {streaming && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
                {recognizedStudents.size} student(s) detected
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              {!streaming ? (
                <button
                  onClick={startStreaming}
                  disabled={!connected || cameraError}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  <Radio className="w-4 h-4" />
                  Start Live Stream
                </button>
              ) : (
                <button
                  onClick={stopStreaming}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                >
                  Stop Stream
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Recognized Students */}
        <div className="space-y-4">
          {/* Live Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Detected Students</h3>
            </div>
            <div className="text-3xl font-bold text-slate-800">{recognizedStudents.size}</div>
            <p className="text-xs text-slate-500 mt-1">Unique students recognized this session</p>
          </div>

          {/* Latest Detection Info */}
          {latestResult && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Latest Frame</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Faces detected</span>
                  <span className="font-medium text-slate-800">{latestResult.totalFaces}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recognized</span>
                  <span className="font-medium text-green-600">{latestResult.recognizedStudents?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unknown</span>
                  <span className="font-medium text-amber-600">{latestResult.unknownFaces}</span>
                </div>
                {latestResult.liveness && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Liveness</span>
                    <span className={`font-medium ${latestResult.liveness.is_live ? 'text-green-600' : 'text-red-600'}`}>
                      {latestResult.liveness.is_live ? 'Live' : 'Spoof?'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 max-h-[400px] overflow-y-auto">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Recognition Log</h3>
            {recognizedList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                {streaming ? 'Scanning for faces...' : 'Start streaming to detect students'}
              </div>
            ) : (
              <div className="space-y-2">
                {recognizedList.map(s => (
                  <div key={s.usn} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.name || s.usn}</p>
                      <p className="text-xs text-slate-500">{s.usn} · {s.confidence ? `${Math.round(s.confidence * 100)}%` : ''}</p>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      x{s.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {streaming && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Frames are sent every 2 seconds for processing. Keep the camera steady for best results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveAttendance;
