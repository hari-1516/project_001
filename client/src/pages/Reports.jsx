import React, { useState } from 'react';
import { Download, FileSpreadsheet, TrendingUp, Users, Calendar } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import AttendanceTable from '../components/AttendanceTable';
import Charts from '../components/Charts';
import { formatDate } from '../utils/helpers';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
    </div>
  </div>
);

const Reports = () => {
  const { data: summary, loading: summaryLoading } = useFetch('/reports/summary');
  const { data: records, loading: recordsLoading } = useFetch('/reports');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Export as CSV
  const handleExport = () => {
    if (!records || records.length === 0) return alert('No data to export.');
    const rows = [['Date', 'Class ID', 'Present', 'Absent', 'Percentage', 'Marked By']];
    records.forEach(r => {
      const total = r.presentStudents.length + r.absentStudents.length;
      const pct = total > 0 ? Math.round((r.presentStudents.length / total) * 100) : 0;
      rows.push([
        formatDate(r.date),
        r.classId,
        r.presentStudents.length,
        r.absentStudents.length,
        `${pct}%`,
        r.createdBy?.name || 'System'
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${selectedDate}.csv`;
    a.click();
  };

  const trendData = summary?.trend || [];
  const donutData = summary
    ? [
        { label: 'Present', value: summary.overallPercentage },
        { label: 'Absent', value: +(100 - summary.overallPercentage).toFixed(1) },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">View analytics and export attendance data</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Students" value={summary?.totalStudents} color="bg-purple-500" />
        <StatCard icon={Calendar} label="Total Classes" value={summary?.totalClasses} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Overall Attendance" value={summary ? `${summary.overallPercentage}%` : null} color="bg-emerald-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart — 7-day trend */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">7-Day Attendance Trend</h2>
          {summaryLoading ? (
            <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <Charts data={trendData} type="bar" />
          )}
        </div>

        {/* Donut Chart — Overall */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Overall Attendance Split</h2>
          {summaryLoading ? (
            <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ) : donutData.length > 0 ? (
            <Charts data={donutData} type="donut" />
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-500" />
            All Attendance Records
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div className="p-6">
          <AttendanceTable records={records} loading={recordsLoading} />
        </div>
      </div>
    </div>
  );
};

export default Reports;
