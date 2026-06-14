import { useState, useEffect } from 'react';
import { Calendar, Search, Check, CheckSquare, XSquare, Save, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AttendanceMarking({ students, branches = [], onSaveSuccess, initialDate, showToast }) {
  const [selectedDate, setSelectedDate] = useState(
    initialDate || new Date().toISOString().split('T')[0]
  );
  
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Extract unique courses for filtering
  const courses = ['All', ...branches.map(b => b.name)];

  // Load existing attendance for selected date
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      if (!selectedDate) return;
      setLoading(true);
      setMessage(null);
      
      try {
        const records = await api.getAttendanceByDate(selectedDate);
        
        // Map student records to state { studentId: boolean }
        const mappedRecords = {};
        
        // Pre-fill with existing records
        records.forEach(r => {
          const sId = typeof r.studentId === 'object' ? r.studentId._id : r.studentId;
          mappedRecords[sId] = r.present;
        });

        // For students not in records, default them to 'true' (Present)
        students.forEach(s => {
          if (mappedRecords[s._id] === undefined) {
            mappedRecords[s._id] = true; 
          }
        });

        setAttendanceRecords(mappedRecords);
      } catch (err) {
        console.error('Error fetching attendance for date:', err);
        const defaultRecords = {};
        students.forEach(s => {
          defaultRecords[s._id] = true;
        });
        setAttendanceRecords(defaultRecords);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingAttendance();
  }, [selectedDate, students]);

  // Handle toggling present/absent for a single student
  const toggleAttendance = (studentId) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Mark all filtered students as present
  const markAllFiltered = (status) => {
    const updated = { ...attendanceRecords };
    filteredStudents.forEach(s => {
      updated[s._id] = status;
    });
    setAttendanceRecords(updated);
    if (showToast) {
      showToast(`Marked all listed students as ${status ? 'Present' : 'Absent'}.`, 'warning');
    }
  };

  // Submit attendance records to server
  const handleSave = async () => {
    setSaveLoading(true);
    setMessage(null);
    
    // Prepare records payload
    const recordsPayload = Object.entries(attendanceRecords).map(([studentId, present]) => ({
      studentId,
      present
    }));

    try {
      await api.saveAttendance(selectedDate, recordsPayload);
      if (showToast) {
        showToast(`Attendance for ${formatDateLabel(selectedDate)} saved successfully!`, 'success');
      } else {
        setMessage({ type: 'success', text: `Attendance for ${formatDateLabel(selectedDate)} saved successfully!` });
      }
      if (onSaveSuccess) {
        onSaveSuccess(); // Refresh global app state
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast('Failed to save attendance. Please try again.', 'error');
      } else {
        setMessage({ type: 'error', text: 'Failed to save attendance. Please try again.' });
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter students for matching search & course
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'All' || student.course === courseFilter;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mark Attendance</h1>
          <p className="text-slate-500 mt-1">Select date and toggle attendance status for each student.</p>
        </div>
        
        {/* Date Picker Widget */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 border border-slate-100 shadow-sm rounded-xl">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]} // Cannot mark future dates
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-slate-700 text-sm font-semibold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Control Bar: Filters, Search, and Bulk Mark */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between gap-4">
        
        {/* Search & Course Filter */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Bulk Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllFiltered(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>All Present</span>
          </button>
          <button
            onClick={() => markAllFiltered(false)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <XSquare className="w-4 h-4" />
            <span>All Absent</span>
          </button>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="text-sm font-semibold">{message.text}</div>
        </div>
      )}

      {/* Student Marking Board */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-sm text-slate-400 mt-2 font-medium">Loading attendance records...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-2" />
          <h3 className="text-slate-500 font-medium">No students registered yet</h3>
          <p className="text-slate-400 text-xs mt-1">Please register students first in the Students directory before marking attendance.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <Search className="w-12 h-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No students found matching your filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Responsive Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((student) => {
              const isPresent = attendanceRecords[student._id] ?? true;
              return (
                <div
                  key={student._id}
                  onClick={() => toggleAttendance(student._id)}
                  className={`p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between h-32 ${
                    isPresent 
                      ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 shadow-sm' 
                      : 'bg-rose-50/50 border-rose-200 hover:border-rose-300 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 line-clamp-1 flex-1">{student.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isPresent ? 'PRESENT' : 'ABSENT'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">Roll: {student.rollNumber}</div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100/50 mt-auto">
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                      {student.course}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      isPresent ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {isPresent ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-xs font-bold font-mono">X</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Footer Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md flex justify-between items-center">
            <div className="text-xs text-slate-500 font-medium">
              Selected: <span className="font-bold text-indigo-600">{Object.values(attendanceRecords).filter(Boolean).length}</span> present,{' '}
              <span className="font-bold text-rose-600">{Object.values(attendanceRecords).filter(v => !v).length}</span> absent
            </div>
            
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4.5 h-4.5" />
                  <span>Save Attendance</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
