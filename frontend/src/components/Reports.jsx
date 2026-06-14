import { useState } from 'react';
import { Search, AlertTriangle, TrendingDown, BookOpen, Download, Calendar, BarChart3 } from 'lucide-react';

export default function Reports({ students, attendance, branches = [], threshold, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');

  // Extract unique courses for filtering
  const courses = ['All', ...branches.map(b => b.name)];

  // Calculate unique dates where attendance was marked for each course
  const datesByCourse = {};
  attendance.forEach(record => {
    const studentObj = record.studentId || {};
    const courseName = studentObj.course;
    if (courseName) {
      if (!datesByCourse[courseName]) {
        datesByCourse[courseName] = new Set();
      }
      datesByCourse[courseName].add(record.date);
    }
  });

  const studentReports = students.map(student => {
    // Filter records for this specific student
    const studentRecords = attendance.filter(record => {
      const sId = typeof record.studentId === 'object' ? record.studentId._id : record.studentId;
      return sId === student._id;
    });

    const presentCount = studentRecords.filter(r => r.present).length;
    const absentCount = studentRecords.filter(r => !r.present).length;
    
    // Total classes conducted for this student's course
    const courseDates = datesByCourse[student.course];
    const classesConducted = courseDates ? courseDates.size : studentRecords.length;

    const percentage = classesConducted > 0 
      ? Math.round((presentCount / classesConducted) * 100) 
      : 100; // Default to 100% if no classes conducted yet

    return {
      ...student,
      presentCount,
      absentCount,
      classesConducted,
      percentage
    };
  });

  // Filter based on search and course filter
  const filteredReports = studentReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'All' || report.course === courseFilter;
    return matchesSearch && matchesCourse;
  });

  // Identify students below the threshold
  const lowAttendanceStudents = filteredReports.filter(r => r.percentage < threshold && r.classesConducted > 0);

  // Dynamic calculations for Analytics Hub
  // 1. Monthly Averages
  const monthlyStats = {};
  attendance.forEach(record => {
    const monthCode = record.date.substring(0, 7); // YYYY-MM
    if (!monthlyStats[monthCode]) {
      monthlyStats[monthCode] = { present: 0, total: 0 };
    }
    monthlyStats[monthCode].total++;
    if (record.present) {
      monthlyStats[monthCode].present++;
    }
  });

  const sortedMonths = Object.keys(monthlyStats)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 4) // Show last 4 months
    .map(code => {
      const [year, month] = code.split('-');
      const dateObj = new Date(year, parseInt(month) - 1);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const pct = Math.round((monthlyStats[code].present / monthlyStats[code].total) * 100);
      return { monthName, pct };
    });

  // 2. Course Performance Averages
  const courseStats = {};
  attendance.forEach(record => {
    const studentObj = record.studentId || {};
    const courseName = studentObj.course || 'Unknown';
    if (!courseStats[courseName]) {
      courseStats[courseName] = { present: 0, total: 0 };
    }
    courseStats[courseName].total++;
    if (record.present) {
      courseStats[courseName].present++;
    }
  });

  const sortedCourses = Object.keys(courseStats)
    .map(name => {
      const pct = Math.round((courseStats[name].present / courseStats[name].total) * 100);
      return { name, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4); // Show top 4 courses

  const getPercentageColor = (pct, classesConducted) => {
    if (classesConducted === 0) return 'text-slate-400 bg-slate-50 border-slate-100';
    if (pct >= threshold) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (pct >= 60) return 'text-amber-700 bg-amber-50 border-amber-100';
    return 'text-rose-700 bg-rose-50 border-rose-100';
  };

  const getProgressBarColor = (pct) => {
    if (pct >= threshold) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      if (showToast) showToast('No report records to export.', 'error');
      return;
    }

    const headers = ['Roll Number', 'Name', 'Course', 'Classes Conducted', 'Present Count', 'Absent Count', 'Attendance Rate (%)'];
    const rows = filteredReports.map(r => [
      `"${r.rollNumber}"`,
      `"${r.name}"`,
      `"${r.course}"`,
      r.classesConducted,
      r.presentCount,
      r.absentCount,
      r.classesConducted > 0 ? `${r.percentage}%` : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendease_report_${courseFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) {
      showToast('Attendance report exported successfully to CSV!', 'success');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor individual percentages, track attendance ratios, and audit alerts.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4.5 h-4.5" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Warning Box for Low Attendance */}
      {lowAttendanceStudents.length > 0 && (
        <div className="bg-rose-50/60 border border-rose-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm shadow-rose-500/5">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-800">Low Attendance Alerts ({lowAttendanceStudents.length} Students)</h4>
            <p className="text-xs text-rose-600/90 mt-1 font-medium leading-relaxed">
              The following students have attendance percentages below your current threshold of <strong>{threshold}%</strong>. Immediate corrective action or notifications may be required.
            </p>
          </div>
        </div>
      )}

      {/* Analytics Hub Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Widget 1: Monthly Attendance Stats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Monthly Attendance Stats
          </h3>
          {sortedMonths.length > 0 ? (
            <div className="space-y-3">
              {sortedMonths.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>{m.monthName}</span>
                    <span className="font-bold text-indigo-600">{m.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${m.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center italic">No monthly logs found.</div>
          )}
        </div>

        {/* Widget 2: Course Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Course Performance (Top Sections)
          </h3>
          {sortedCourses.length > 0 ? (
            <div className="space-y-3">
              {sortedCourses.map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>{c.name}</span>
                    <span className="font-bold text-indigo-600">{c.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${c.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center italic">No branch records found.</div>
          )}
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Course Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Course:</label>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-semibold"
          >
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6 text-center">Classes Conducted</th>
                  <th className="py-4 px-6 text-center">Attended</th>
                  <th className="py-4 px-6 text-center">Absent</th>
                  <th className="py-4 px-6">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredReports.map((report) => {
                  const colorClass = getPercentageColor(report.percentage, report.classesConducted);
                  const barColor = getProgressBarColor(report.percentage);
                  const isLow = report.percentage < threshold && report.classesConducted > 0;
                  return (
                    <tr 
                      key={report._id} 
                      className={`transition-colors ${
                        isLow 
                          ? 'bg-rose-50/15 hover:bg-rose-50/25 border-l-4 border-rose-500' 
                          : 'hover:bg-slate-50/50 border-l-4 border-transparent'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{report.name}</span>
                          {isLow && (
                            <span className="p-0.5 bg-rose-100 text-rose-600 rounded-full" title="Below threshold!">
                              <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{report.rollNumber}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-200/50">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          {report.course}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-slate-700">{report.classesConducted}</td>
                      <td className="py-4 px-6 text-center font-bold text-emerald-600">{report.presentCount}</td>
                      <td className="py-4 px-6 text-center font-bold text-rose-500">{report.absentCount}</td>
                      <td className="py-4 px-6 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`${barColor} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${report.classesConducted > 0 ? report.percentage : 0}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                            {report.classesConducted > 0 ? `${report.percentage}%` : 'N/A'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <TrendingDown className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">No report records found</p>
            <p className="text-slate-400 text-xs mt-1">Verify that you have students registered and attendance marked.</p>
          </div>
        )}
      </div>
    </div>
  );
}
