import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, History, BarChart3, AlertCircle, RefreshCw, BookOpen, Menu, X, CheckCircle, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { api } from './services/api';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import AttendanceMarking from './components/AttendanceMarking';
import AttendanceHistory from './components/AttendanceHistory';
import Reports from './components/Reports';
import Branches from './components/Branches';
import Login from './components/Login';
import Settings from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth States
  const [token, setToken] = useState(localStorage.getItem('attendease_token') || null);
  const [teacher, setTeacher] = useState(() => {
    try {
      const cached = localStorage.getItem('attendease_teacher');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // App States
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [branches, setBranches] = useState([]);
  const [threshold, setThreshold] = useState(75);
  const [dbStatus, setDbStatus] = useState(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);
  const [editDate, setEditDate] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLoginSuccess = (newToken, newTeacher) => {
    localStorage.setItem('attendease_token', newToken);
    localStorage.setItem('attendease_teacher', JSON.stringify(newTeacher));
    setToken(newToken);
    setTeacher(newTeacher);
    setActiveTab('dashboard');
    showToast(`Welcome back, ${newTeacher.name}!`, 'success');
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('attendease_token');
    localStorage.removeItem('attendease_teacher');
    setToken(null);
    setTeacher(null);
    setStudents([]);
    setAttendance([]);
    setBranches([]);
    setDbStatus(null);
    showToast('Logged out successfully.', 'success');
  }, []);

  const handleApiCall = useCallback(async (apiFunc, ...args) => {
    try {
      return await apiFunc(...args);
    } catch (err) {
      console.error(err);
      if (err.message.includes('Not authorized') || err.message.includes('token')) {
        handleLogout();
      }
      throw err;
    }
  }, [handleLogout]);

  // Fetch all initial data
  const fetchData = useCallback(async (showRefresher = false) => {
    if (!token) return;
    if (showRefresher) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const [studentsData, attendanceData, statusData, branchesData] = await Promise.all([
        handleApiCall(api.getStudents),
        handleApiCall(api.getAttendance),
        handleApiCall(api.getStatus),
        handleApiCall(api.getBranches)
      ]);
      setStudents(studentsData);
      setAttendance(attendanceData);
      setDbStatus(statusData);
      setBranches(branchesData);
    } catch (err) {
      console.error(err);
      if (!err.message.includes('Not authorized') && !err.message.includes('token')) {
        setError('Connection to backend failed. Please verify that the server is running on port 5000.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, handleApiCall]);

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => {
        fetchData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [token, fetchData]);

  // Handler for add/edit/delete student triggers
  const handleAddStudent = async (studentData) => {
    const newStudent = await handleApiCall(api.addStudent, studentData);
    setStudents(prev => [...prev, newStudent]);
    await refreshStats();
  };

  const handleUpdateStudent = async (id, studentData) => {
    const updated = await handleApiCall(api.updateStudent, id, studentData);
    setStudents(prev => prev.map(s => s._id === id ? updated : s));
    await fetchData(true);
  };

  const handleDeleteStudent = async (id) => {
    await handleApiCall(api.deleteStudent, id);
    setStudents(prev => prev.filter(s => s._id !== id));
    await fetchData(true);
  };

  const refreshStats = async () => {
    try {
      const statusData = await handleApiCall(api.getStatus);
      setDbStatus(statusData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedMockData = async () => {
    await handleApiCall(api.seedData);
    await fetchData(true); // Full reload
  };

  // Switch tab & scroll to top
  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab !== 'attendance') {
      setEditDate(null);
    }
  };

  if (!token) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        {toast && (
          <div className="fixed bottom-5 right-5 z-[100] animate-zoom-in">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // Redirect edit attendance trigger from history tab
  const handleEditAttendanceRedirect = (date) => {
    setEditDate(date);
    handleNavigate('attendance');
  };

  // Nav items configuration
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'branches', label: 'Branches', icon: BookOpen },
    { id: 'attendance', label: 'Mark Attendance', icon: ClipboardCheck },
    { id: 'history', label: 'Attendance History', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 h-screen ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header / Logo */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/30">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight">AttendEase</span>
              <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Smart Attendance & Analytics</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {refreshing && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer md:hidden"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 translate-x-1'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:translate-x-1'
                }`}
              >
                <IconComponent className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Branding Details */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-left">
          <div className="text-xs font-bold text-slate-200">AttendEase v1.0</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5 leading-normal">Smart Attendance & Analytics Platform</div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between md:sticky md:top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer md:hidden"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider md:hidden">AttendEase</span>
            <div className="hidden md:flex items-center gap-2.5">
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200/50 rounded-lg">
                Faculty Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchData(true)}
              className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 text-white flex items-center justify-center font-black rounded-lg text-sm shadow-md shadow-indigo-600/20">
                  {teacher?.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-700">{teacher?.name || 'Teacher Account'}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{teacher?.email || 'teacher@attendease.com'}</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                title="Logout"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Component container */}
        <div className="p-6 md:p-8 flex-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
              <span className="text-sm text-slate-400 mt-2 font-medium">Loading panel components...</span>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto mt-20 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm text-center space-y-4">
              <div className="p-3 bg-rose-50 text-rose-600 inline-block rounded-2xl">
                <AlertCircle className="w-10 h-10 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Connectivity Error</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
              <button
                onClick={() => fetchData()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer inline-block"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  students={students} 
                  attendance={attendance} 
                  onNavigate={handleNavigate} 
                />
              )}
              {activeTab === 'students' && (
                <Students 
                  students={students} 
                  branches={branches}
                  onAddStudent={handleAddStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  showToast={showToast}
                />
              )}
              {activeTab === 'branches' && (
                <Branches 
                  branches={branches}
                  students={students}
                  onAddBranch={async (name) => {
                    const newBranch = await handleApiCall(api.addBranch, { name });
                    setBranches(prev => [...prev, newBranch]);
                    await refreshStats();
                    showToast(`Branch "${name}" created successfully!`, 'success');
                  }}
                  onDeleteBranch={async (id) => {
                    await handleApiCall(api.deleteBranch, id);
                    setBranches(prev => prev.filter(b => b._id !== id));
                    await refreshStats();
                    showToast('Branch deleted successfully!', 'success');
                  }}
                />
              )}
              {activeTab === 'attendance' && (
                <AttendanceMarking 
                  students={students} 
                  branches={branches}
                  onSaveSuccess={() => fetchData(true)}
                  initialDate={editDate}
                  clearInitialDate={() => setEditDate(null)}
                  showToast={showToast}
                />
              )}
              {activeTab === 'history' && (
                <AttendanceHistory 
                  attendance={attendance} 
                  onNavigateToMark={handleEditAttendanceRedirect}
                />
              )}
              {activeTab === 'reports' && (
                <Reports 
                  students={students} 
                  attendance={attendance} 
                  branches={branches}
                  threshold={threshold}
                  showToast={showToast}
                />
              )}
              {activeTab === 'settings' && (
                <Settings 
                  threshold={threshold}
                  onUpdateThreshold={setThreshold}
                  dbStatus={dbStatus}
                  onTriggerSeed={handleSeedMockData}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] animate-zoom-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
