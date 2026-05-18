import { BookOpen } from 'lucide-react';
import { getPercentageBadge } from '../utils/helpers';

const StudentCard = ({ student, percentage }) => {
  if (!student) return null;

  const initials = student.name
    ? student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {student.photo ? (
            <img src={student.photo} alt={student.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{student.name}</p>
          <p className="text-xs text-slate-500 font-mono">{student.usn}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{student.department} — Year {student.year}, Sec {student.section}</span>
        </div>
      </div>

      {/* Attendance Badge */}
      {percentage !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500">Attendance</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${getPercentageBadge(percentage)}`}>
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
};

export default StudentCard;
