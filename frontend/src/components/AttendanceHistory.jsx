import { useState } from 'react';
import { Calendar, Search, CheckCircle, XCircle, Edit3, ArrowRight, UserCheck, UserX, Info } from 'lucide-react';

export default function AttendanceHistory({ attendance, onNavigateToMark }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  // Group attendance by date
  const recordsByDate = {};
  attendance.forEach(record => {
    if (!recordsByDate[record.date]) {
      recordsByDate[record.date] = {
        date: record.date,
        present: 0,
        absent: 0,
        total: 0,
        records: []
      };
    }
    recordsByDate[record.date].total++;
    if (record.present) {
      recordsByDate[record.date].present++;
    } else {
      recordsByDate[record.date].absent++;
    }
    recordsByDate[record.date].records.push(record);
  });

  // Sort dates descending
  const sortedDates = Object.keys(recordsByDate).sort((a, b) => b.localeCompare(a));

  // Default select the most recent date if nothing selected
  if (!selectedDate && sortedDates.length > 0) {
    setSelectedDate(sortedDates[0]);
  }

  // Filter dates
  const filteredDates = sortedDates.filter(dateStr => {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    return formattedDate.toLowerCase().includes(searchTerm.toLowerCase()) || dateStr.includes(searchTerm);
  });

  const activeRecords = selectedDate ? recordsByDate[selectedDate] : null;

  const formatDateLong = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateShort = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance History</h1>
        <p className="text-slate-500 mt-1">Review historical records, analyze daily counts, and edit past submissions.</p>
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-2" />
          <h3 className="text-slate-500 font-medium">No historical records found</h3>
          <p className="text-slate-400 text-xs mt-1">Attendance logs will appear here once you mark and save them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Panel: Date Timeline List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[550px]">
            {/* Search Date Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Scrollable Date list */}
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {filteredDates.map((dateStr) => {
                const dayData = recordsByDate[dateStr];
                const isSelected = selectedDate === dateStr;
                const pct = Math.round((dayData.present / dayData.total) * 100);
                
                let pctClasses = 'bg-emerald-50 text-emerald-700 border-emerald-100/50';
                if (pct < 75) {
                  pctClasses = pct >= 60 
                    ? 'bg-amber-50 text-amber-700 border-amber-100/50' 
                    : 'bg-rose-50 text-rose-700 border-rose-100/50';
                }

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`p-4 cursor-pointer text-left transition-all duration-200 flex justify-between items-center border-l-4 ${
                      isSelected 
                        ? 'bg-indigo-50/60 border-indigo-600 pl-5' 
                        : 'hover:bg-slate-50 border-transparent pl-4 hover:pl-5'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-700">{formatDateShort(dateStr)}</div>
                      <div className="text-xs text-slate-400 font-medium">
                        {dayData.present} Present &bull; {dayData.absent} Absent
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pctClasses}`}>
                        {pct}%
                      </span>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-350'}`} />
                    </div>
                  </div>
                );
              })}
              {filteredDates.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">No dates match your query</div>
              )}
            </div>
          </div>

          {/* Right Panel: Detailed Logs for Selected Date */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col h-[550px]">
            {activeRecords ? (
              <>
                {/* Details Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{formatDateLong(selectedDate)}</h3>
                    <p className="text-xs text-slate-400 mt-1">Detailed logs for this session</p>
                  </div>
                  <button
                    onClick={() => onNavigateToMark(selectedDate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Attendance</span>
                  </button>
                </div>

                {/* Day Summary Cards */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50/30 border-b border-slate-100">
                  <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Present</div>
                      <div className="text-lg font-bold text-slate-800">{activeRecords.present}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-2.5">
                    <UserX className="w-5 h-5 text-rose-500" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Absent</div>
                      <div className="text-lg font-bold text-slate-800">{activeRecords.absent}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-2.5">
                    <Info className="w-5 h-5 text-indigo-500" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Rate</div>
                      <div className="text-lg font-bold text-indigo-700">
                        {Math.round((activeRecords.present / activeRecords.total) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Records List */}
                <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                  {activeRecords.records.map((record) => {
                    const student = record.studentId || {};
                    return (
                      <div key={record._id} className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-50/40 transition-colors">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{student.name || 'Unknown Student'}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {student.rollNumber || 'N/A'}
                            </span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {student.course || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          {record.present ? (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-100/30">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span>Present</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1 rounded-full font-bold border border-rose-100/30">
                              <XCircle className="w-4 h-4 text-rose-500" />
                              <span>Absent</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Info className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-slate-400 text-sm">Select a date on the left to view detailed logs</p>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
