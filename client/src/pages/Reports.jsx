import { useState } from 'react';
import { Download, FileSpreadsheet, TrendingUp, Users, Calendar, FileText, AlertTriangle, BarChart3 } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import AttendanceTable from '../components/AttendanceTable';
import Charts from '../components/Charts';
import { formatDate } from '../utils/helpers';
import api from '../api';

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

const escapeCSV = (val) => {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const Reports = () => {
  const { data: summary, loading: summaryLoading } = useFetch('/reports/summary');
  const { data: recordsResponse, loading: recordsLoading } = useFetch('/reports?limit=500');
  const { data: lowAttendance } = useFetch('/reports/low-attendance');
  const { data: engagement, loading: engagementLoading } = useFetch('/reports/analytics/engagement');
  const { data: predictions, loading: predictionsLoading } = useFetch('/reports/analytics/predict');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(null);

  const records = recordsResponse?.records || recordsResponse;

  // Filter records by selected date
  const filteredRecords = records
    ? records.filter(r => {
        if (!selectedDate) return true;
        const recordDate = new Date(r.date).toISOString().split('T')[0];
        return recordDate === selectedDate;
      })
    : records;

  // Export as CSV
  const handleExportCSV = () => {
    const dataToExport = filteredRecords || records;
    if (!dataToExport || dataToExport.length === 0) return alert('No data to export.');
    const rows = [['Date', 'Time', 'Class ID', 'Present', 'Absent', 'Percentage', 'Marked By']];
    dataToExport.forEach(r => {
      const present = r.presentStudents || [];
      const absent = r.absentStudents || [];
      const total = present.length + absent.length;
      const pct = total > 0 ? Math.round((present.length / total) * 100) : 0;
      rows.push([
        formatDate(r.date),
        r.time || '—',
        r.classId,
        present.length,
        absent.length,
        `${pct}%`,
        r.createdBy?.name || 'System'
      ]);
    });
    const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Excel
  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const response = await api.get('/reports/export/excel', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export Excel file');
    } finally {
      setExporting(null);
    }
  };

  // Export as PDF
  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const response = await api.get('/reports/export/pdf', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export PDF file');
    } finally {
      setExporting(null);
    }
  };

  const trendData = summary?.trend || [];
  const donutData = summary
    ? [
        { label: 'Present', value: summary.overallPercentage },
        { label: 'Absent', value: +(100 - summary.overallPercentage).toFixed(1) },
      ]
    : [];

  const riskColors = {
    critical: 'bg-red-100 border-red-300 text-red-800',
    high: 'bg-orange-100 border-orange-300 text-orange-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    low: 'bg-green-100 border-green-300 text-green-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">View analytics and export attendance data</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exporting === 'excel'}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting === 'excel' ? 'Exporting...' : 'Excel'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting === 'pdf'}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Students" value={summary?.totalStudents} color="bg-purple-500" />
        <StatCard icon={Calendar} label="Total Classes" value={summary?.totalClasses} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Overall Attendance" value={summary ? `${summary.overallPercentage}%` : null} color="bg-emerald-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">7-Day Attendance Trend</h2>
          {summaryLoading ? (
            <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <Charts data={trendData} type="bar" />
          )}
        </div>

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

      {/* Engagement Analytics */}
      {engagement && engagement.byDepartment?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Attendance by Department
          </h2>
          {engagementLoading ? (
            <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {engagement.byDepartment.map(d => (
                <div key={d.department} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{d.department}</p>
                    <p className="text-xs text-slate-500">{d.presentCount} present records</p>
                  </div>
                  <span className={`text-lg font-bold ${d.percentage >= 75 ? 'text-green-600' : d.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {d.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance Predictions */}
      {predictions && predictions.predictions?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Attendance Predictions ({predictions.predictions.length} at-risk students)
          </h2>
          {predictionsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.predictions.slice(0, 10).map(p => (
                <div key={p.student?._id || p.student?.usn} className={`border rounded-xl p-4 ${riskColors[p.risk] || riskColors.medium}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className="font-semibold">{p.student?.name}</p>
                      <p className="text-xs opacity-75">{p.student?.usn} · {p.student?.department}-{p.student?.section}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-xs opacity-75">Overall</p>
                        <p className="font-bold">{p.overallPercentage}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs opacity-75">Recent</p>
                        <p className="font-bold">{p.recentPercentage}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs opacity-75">Predicted</p>
                        <p className="font-bold">{p.predictedPercentage}%</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs mt-2 opacity-75">{p.riskMessage}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Low Attendance Risk */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Low Attendance Risk</h2>
        {lowAttendance?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowAttendance.map(row => (
              <div key={row.student?._id || row.student?.usn} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <p className="font-semibold text-slate-800">{row.student?.name}</p>
                <p className="text-xs text-slate-500">{row.student?.usn} · {row.student?.department}-{row.student?.section}</p>
                <p className="mt-2 text-sm text-amber-700">{row.percentage}% attendance across {row.totalClasses} class(es)</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No students are below the 75% threshold.</p>
        )}
      </div>

      {/* All Records Table */}
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
          <AttendanceTable records={filteredRecords} loading={recordsLoading} />
        </div>
      </div>
    </div>
  );
};

export default Reports;
