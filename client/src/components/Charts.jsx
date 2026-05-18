/**
 * Mini bar chart for attendance trends — pure CSS, no library needed.
 * data: [{ date: 'YYYY-MM-DD', present: N, absent: N }, ...]
 */
const Charts = ({ data = [], type = 'bar' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        No data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.present + d.absent), 1);

  if (type === 'bar') {
    return (
      <div className="space-y-1">
        <div className="flex items-end gap-2 h-40 px-2">
          {data.map((d, i) => {
            const presentHeight = (d.present / maxVal) * 100;
            const absentHeight = (d.absent / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute -mt-10 bg-slate-800 text-white text-xs rounded-lg px-2 py-1 pointer-events-none z-10 whitespace-nowrap">
                  Present: {d.present} | Absent: {d.absent}
                </div>
                {/* Stacked bars */}
                <div className="w-full flex flex-col justify-end h-full gap-0.5">
                  <div
                    className="w-full bg-red-300 rounded-t-sm transition-all"
                    style={{ height: `${absentHeight}%` }}
                  />
                  <div
                    className="w-full bg-purple-500 rounded-t-sm transition-all"
                    style={{ height: `${presentHeight}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-2 px-2">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[10px] text-slate-400 truncate">
              {d.date?.slice(5) || d.label || i + 1}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-4 justify-center text-xs text-slate-500 mt-2">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" /> Present</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-300 inline-block" /> Absent</span>
        </div>
      </div>
    );
  }

  if (type === 'donut') {
    const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
    const RADIUS = 40;
    const CX = 60, CY = 60;
    const circumference = 2 * Math.PI * RADIUS;

    const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const segments = data.map((d, i) => {
      const previous = data.slice(0, i).reduce((sum, item) => sum + ((item.value || 0) / total), 0);
      const pct = (d.value || 0) / total;

      return {
        ...d,
        dash: circumference * pct,
        offset: circumference * (1 - previous),
      };
    });

    return (
      <div className="flex items-center gap-6">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {segments.map((d, i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="18"
              strokeDasharray={`${d.dash} ${circumference}`}
              strokeDashoffset={d.offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
            />
          ))}
          <text x={CX} y={CY + 5} textAnchor="middle" className="text-xs" fill="#334155" fontSize="14" fontWeight="600">
            {Math.round((data[0]?.value / total) * 100)}%
          </text>
        </svg>
        <div className="space-y-1.5">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
              <span className="text-slate-600">{d.label}</span>
              <span className="font-semibold text-slate-800 ml-auto">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default Charts;
