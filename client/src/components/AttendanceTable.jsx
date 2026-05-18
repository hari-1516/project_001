import { formatDate, getPercentageBadge } from '../utils/helpers';

const AttendanceTable = ({ records = [], loading = false }) => {
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
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Class ID</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Present</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Absent</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Attendance %</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Marked By</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const total = record.presentStudents.length + record.absentStudents.length;
            const pct = total > 0 ? Math.round((record.presentStudents.length / total) * 100) : 0;
            return (
              <tr key={record._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-slate-700">{formatDate(record.date)}</td>
                <td className="py-3 px-4">
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg font-medium text-xs">
                    {record.classId}
                  </span>
                </td>
                <td className="py-3 px-4 text-green-600 font-medium">{record.presentStudents.length}</td>
                <td className="py-3 px-4 text-red-500 font-medium">{record.absentStudents.length}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getPercentageBadge(pct)}`}>
                    {pct}%
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {record.createdBy?.name || 'System'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
