import { Users, CheckCircle, XCircle, Percent, Calendar, ArrowRight, TrendingUp, Sparkles, Activity } from 'lucide-react';

export default function Dashboard({ students, attendance, onNavigate }) {
  // Get today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter attendance for today
  const todaysAttendance = attendance.filter(a => a.date === todayStr);
  const presentToday = todaysAttendance.filter(a => a.present).length;
  const absentToday = todaysAttendance.filter(a => !a.present).length;
  const todayMarked = todaysAttendance.length > 0;

  // Calculate Average Attendance Percentage across all records
  const totalRecordsCount = attendance.length;
  const presentRecordsCount = attendance.filter(a => a.present).length;
  const averageAttendance = totalRecordsCount > 0 
    ? Math.round((presentRecordsCount / totalRecordsCount) * 100) 
    : 0;

  // Get recent attendance days
  const attendanceByDate = {};
  attendance.forEach(record => {
    if (!attendanceByDate[record.date]) {
      attendanceByDate[record.date] = { date: record.date, present: 0, absent: 0, total: 0 };
    }
    attendanceByDate[record.date].total++;
    if (record.present) {
      attendanceByDate[record.date].present++;
    } else {
      attendanceByDate[record.date].absent++;
    }
  });

  const sortedDates = Object.values(attendanceByDate).sort((a, b) => b.date.localeCompare(a.date));
  const recentActivities = sortedDates.slice(0, 5); // top 5 recent days

  // Generate data for trend chart (last 7 recorded days, in chronological order)
  const chartDays = Object.values(attendanceByDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Overview Headers */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-500" />
            Overview Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Real-time attendance summaries, daily track logs, and metrics analysis.</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-indigo-50/60 border border-indigo-100/40 rounded-2xl text-indigo-600 text-sm font-semibold shadow-sm">
          <Calendar className="w-4.5 h-4.5" />
          <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Students */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-slate-200/60 transition-all duration-300 group">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
            <div className="text-3xl font-black text-slate-800">{students.length}</div>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">Active Directory</span>
          </div>
          <div className="p-4 bg-indigo-50/80 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-slate-200/60 transition-all duration-300 group">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Present Today</span>
            <div className="text-3xl font-black text-emerald-600">
              {todayMarked ? presentToday : '-'}
            </div>
            <span className="text-xs text-slate-500 font-medium block">
              {todayMarked ? `${Math.round((presentToday / (presentToday + absentToday)) * 100)}% attendance rate` : 'Attendance not marked'}
            </span>
          </div>
          <div className="p-4 bg-emerald-50/80 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Absent Today */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-slate-200/60 transition-all duration-300 group">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Absent Today</span>
            <div className="text-3xl font-black text-rose-600">
              {todayMarked ? absentToday : '-'}
            </div>
            <span className="text-xs text-slate-500 font-medium block">
              {todayMarked ? `${Math.round((absentToday / (presentToday + absentToday)) * 100)}% absence rate` : 'Attendance not marked'}
            </span>
          </div>
          <div className="p-4 bg-rose-50/80 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Avg Attendance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-slate-200/60 transition-all duration-300 group">
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Avg Attendance</span>
            <div className="text-3xl font-black text-indigo-600">{averageAttendance}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-indigo-500 h-full transition-all duration-500 rounded-full" 
                style={{ width: `${averageAttendance}%` }} 
              />
            </div>
          </div>
          <div className="p-4 bg-indigo-50/80 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 ml-4">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Chart (Takes 2 columns on large screens) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between hover:border-slate-200/40 transition-colors">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  Attendance Trends
                </h3>
                <p className="text-xs text-slate-400">Daily attendance percentages for the last 7 sessions</p>
              </div>
            </div>

            {chartDays.length > 0 ? (
              <div className="flex">
                {/* Y-axis Labels */}
                <div className="flex flex-col justify-between text-[10px] text-slate-400 font-bold h-64 pr-3 pb-6 border-r border-slate-100/80">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>

                {/* Chart body */}
                <div className="flex-1 h-64 flex items-end justify-around pt-6 border-b border-slate-100 relative pl-2">
                  {/* Horizontal reference grid lines */}
                  <div className="absolute left-0 right-0 border-t border-slate-100 border-dashed top-0 h-0" />
                  <div className="absolute left-0 right-0 border-t border-slate-100 border-dashed top-1/4 h-0" />
                  <div className="absolute left-0 right-0 border-t border-slate-100 border-dashed top-2/4 h-0" />
                  <div className="absolute left-0 right-0 border-t border-slate-100 border-dashed top-3/4 h-0" />

                  {chartDays.map((day) => {
                    const pct = Math.round((day.present / day.total) * 100);
                    
                    // Dynamic coloring based on attendance performance
                    let barColor = 'from-indigo-600 to-indigo-400 hover:from-indigo-700 hover:to-indigo-500';
                    if (pct < 75) {
                      barColor = pct >= 60 
                        ? 'from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500' 
                        : 'from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500';
                    }
                    
                    return (
                      <div key={day.date} className="flex flex-col items-center group relative z-10 w-12">
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                          {pct}% ({day.present}/{day.total} Students)
                        </div>
                        
                        {/* Bar container */}
                        <div className="w-8 bg-slate-50 rounded-t-xl h-44 flex items-end overflow-hidden group-hover:bg-slate-100/80 transition-colors">
                          <div 
                            className={`w-full bg-gradient-to-t ${barColor} rounded-t-xl transition-all duration-700`} 
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        
                        {/* Date label */}
                        <span className="text-[10px] text-slate-400 font-semibold mt-2 text-center whitespace-nowrap">
                          {formatDate(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50">
                <Calendar className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-slate-500 font-semibold text-sm">No trend data available yet</p>
                <p className="text-slate-400 text-xs mt-1 text-center max-w-sm">Mark attendance on multiple days to view charts.</p>
              </div>
            )}
          </div>

          {chartDays.length > 0 && (
            <div className="flex justify-around items-center pt-4 text-[11px] text-slate-400 border-t border-slate-100 mt-4 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                <span>Attendance rate &ge; 75%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                <span>Warning (60% - 74%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                <span>Urgent (&lt; 60%)</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-slate-200/40 transition-colors">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </h3>

            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const pct = Math.round((activity.present / activity.total) * 100);
                  
                  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-100/50';
                  if (pct < 75) {
                    colorClasses = pct >= 60 
                      ? 'bg-amber-50 text-amber-700 border-amber-100/50' 
                      : 'bg-rose-50 text-rose-700 border-rose-100/50';
                  }

                  return (
                    <div key={activity.date} className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50 transition-all border border-slate-50">
                      <div>
                        <div className="text-sm font-bold text-slate-700">{formatDate(activity.date)}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {activity.present} Present &bull; {activity.absent} Absent
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${colorClasses}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Calendar className="w-12 h-12 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400 font-medium">No attendance history found.</p>
                <button 
                  onClick={() => onNavigate('attendance')} 
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold mt-2 underline"
                >
                  Mark attendance now
                </button>
              </div>
            )}
          </div>

          {recentActivities.length > 0 && (
            <button
              onClick={() => onNavigate('history')}
              className="w-full flex items-center justify-center gap-2 mt-6 py-2.5 bg-slate-50 hover:bg-indigo-50/60 text-indigo-600 hover:text-indigo-700 rounded-xl text-xs font-bold border border-slate-100 hover:border-indigo-150 transition-all cursor-pointer"
            >
              <span>View Attendance History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
