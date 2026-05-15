import { createContext, useState, useContext } from 'react';
import api from '../api';

const AttendanceContext = createContext();

export const useAttendance = () => useContext(AttendanceContext);

export const AttendanceProvider = ({ children }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // In a real scenario, this would aggregate data from the backend
      const { data: allStudents } = await api.get('/students');
      
      // Mock stats for dashboard using real total students count
      return {
        totalStudents: allStudents.length,
        presentToday: Math.floor(allStudents.length * 0.8), // Placeholder
        absentToday: allStudents.length - Math.floor(allStudents.length * 0.8),
        attendancePercentage: 80,
      };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    attendanceData,
    students,
    loading,
    error,
    fetchDashboardStats,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};
