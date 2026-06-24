import { useState } from 'react';
import { formatDate, getPercentageBadge } from '../utils/helpers';
import React from 'react';

const AttendanceTable = ({ records = [], loading = false }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        No attendance records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Date</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Time</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Class ID</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Present</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Absent</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Attendance %</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Marked By</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const total = (record.presentStudents?.length || 0) + (record.absentStudents?.length || 0);
            const pct = total > 0 ? Math.round(((record.presentStudents?.length || 0) / total) * 100) : 0;
            const isExpanded = expandedRow === record._id;
            return (
              <React.Fragment key={record._id}>
                <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : record._id)}>
                  <td className="py-3 px-4 text-slate-700">{formatDate(record.date)}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{record.time || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg font-medium text-xs">
                      {record.classId}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-green-600 font-medium">{record.presentStudents?.length || 0}</td>
                  <td className="py-3 px-4 text-red-500 font-medium">{record.absentStudents?.length || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getPercentageBadge(pct)}`}>
                      {pct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {record.createdBy?.name || 'System'}
                  </td>
                </tr>
                {isExpanded && record.absentStudents && record.absentStudents.length > 0 && (
                  <tr key={`${record._id}-absent`} className="bg-red-50/50">
                    <td colSpan="7" className="py-3 px-4">
                      <p className="text-xs font-semibold text-red-600 mb-2">Absent Students ({record.absentStudents.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {record.absentStudents.map((student) => (
                          <span key={student?._id || student?.usn} className="inline-flex items-center gap-1 px-3 py-1 bg-white text-red-700 rounded-full text-xs font-medium border border-red-100 shadow-sm">
                            {student?.name}
                            <span className="text-red-400">({student?.usn})</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
