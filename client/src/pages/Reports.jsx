import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import api from '../api';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get('/attendance/report');
        setReportData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Reports</h1>
          <p className="text-slate-500 text-sm">View and export monthly analytics</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Monthly Overview - May 2026</h2>
          </div>
        </div>
        
        <div className="p-6 flex flex-col items-center justify-center py-16">
          <FileSpreadsheet className="w-16 h-16 text-slate-200 mb-4" />
          {loading ? (
            <p className="text-slate-500">Loading report data...</p>
          ) : (
            <div className="text-center">
              <p className="text-slate-700 font-medium mb-2">Backend Response:</p>
              <pre className="bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">
                {JSON.stringify(reportData, null, 2)}
              </pre>
              <p className="text-slate-500 mt-4 text-sm">Full data tables will be implemented in the next phase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
