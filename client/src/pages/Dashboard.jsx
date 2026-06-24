import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CheckCircle, XCircle, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import api from '../api';

const StatCard = ({ title, value, icon: Icon, color, trend, onClick, clickable }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow ${clickable ? 'cursor-pointer hover:border-blue-200' : ''}`}
  >
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      {trend && (
        <p className="text-sm font-medium text-green-500 mt-2 flex items-center">
          <TrendingUp className="w-4 h-4 mr-1" />
          {trend}
        </p>
      )}
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
      <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-').replace('-100', '-600')}`} />
    </div>
  </div>
);

const Dashboard = () => {
  const { fetchDashboardStats } = useAttendance();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendancePercentage: 0
  });
  const [trendData, setTrendData] = useState([]);
  const [showStudents, setShowStudents] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [expandedDept, setExpandedDept] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchDashboardStats().then(data => {
      if (data) setStats(data);
    });
    // Fetch real trend data
    api.get('/reports/summary')
      .then(({ data }) => {
        if (data?.trend) {
          setTrendData(data.trend.map(t => ({
            name: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
            present: t.present,
            absent: t.absent
          })));
        }
      })
      .catch(() => {});
  }, [fetchDashboardStats]);

  const toggleStudentList = async () => {
    if (!showStudents && departments.length === 0) {
      setLoadingStudents(true);
      try {
        const { data } = await api.get('/reports/students-by-department');
        setDepartments(data);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoadingStudents(false);
      }
    }
    setShowStudents(!showStudents);
  };

  const toggleDept = (dept) => {
    setExpandedDept(expandedDept === dept ? null : dept);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, here's today's attendance summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="bg-blue-100"
          onClick={toggleStudentList}
          clickable
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={CheckCircle}
          color="bg-green-100"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          icon={XCircle}
          color="bg-red-100"
        />
        <StatCard
          title="Avg. Attendance"
          value={`${stats.attendancePercentage}%`}
          icon={TrendingUp}
          color="bg-purple-100"
        />
      </div>

      {showStudents && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Students by Department</h2>
                <p className="text-sm text-slate-500 mt-1">Click a department to expand</p>
              </div>
              <button
                onClick={() => setShowStudents(false)}
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
          </div>

          {loadingStudents ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading students...
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {departments.map((dept) => (
                <div key={dept.department}>
                  <button
                    onClick={() => toggleDept(dept.department)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedDept === dept.department ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="font-semibold text-slate-700">{dept.department}</span>
                      <span className="text-sm text-slate-400">({dept.count} students)</span>
                    </div>
                    <div className="flex gap-1">
                      {[...new Set(dept.students.map(s => s.year))].sort().map(year => (
                        <span key={year} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                          Y{year}
                        </span>
                      ))}
                    </div>
                  </button>

                  {expandedDept === dept.department && (
                    <div className="px-6 pb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Name</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-500">USN</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Year</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Section</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dept.students.map((student) => (
                            <tr key={student.usn} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-700 font-medium">{student.name}</td>
                              <td className="py-2 px-3 text-slate-500">{student.usn}</td>
                              <td className="py-2 px-3 text-slate-500">Year {student.year}</td>
                              <td className="py-2 px-3 text-slate-500">{student.section}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {departments.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No students found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Attendance Trends</h2>
        <div className="h-[350px] w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="present" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No attendance data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
