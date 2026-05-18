import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

const data = [
  { name: 'Mon', present: 85, absent: 15 },
  { name: 'Tue', present: 88, absent: 12 },
  { name: 'Wed', present: 92, absent: 8 },
  { name: 'Thu', present: 80, absent: 20 },
  { name: 'Fri', present: 95, absent: 5 },
  { name: 'Sat', present: 90, absent: 10 },
];

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
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

  useEffect(() => {
    fetchDashboardStats().then(data => {
      if (data) setStats(data);
    });
  }, [fetchDashboardStats]);

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
          trend="+2.5% this week"
        />
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Attendance Trends</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
