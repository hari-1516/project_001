import { createContext, useState, useContext, useCallback } from 'react';
import api from '../api';

const AttendanceContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAttendance = () => useContext(AttendanceContext);

export const AttendanceProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data: summary } = await api.get('/reports/summary');
      const { data: daily } = await api.get('/reports/daily');

      const presentToday = (daily.records || []).reduce(
        (sum, record) => sum + (record.presentStudents?.length || 0),
        0
      );
      const absentToday = (daily.records || []).reduce(
        (sum, record) => sum + (record.absentStudents?.length || 0),
        0
      );

      return {
        totalStudents: summary.totalStudents,
        presentToday,
        absentToday,
        attendancePercentage: summary.overallPercentage,
      };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
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
