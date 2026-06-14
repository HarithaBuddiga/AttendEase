import { useState } from 'react';
import { ClipboardCheck, Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const data = await api.login(email.trim(), password.trim());
      // Hand over token and teacher info to parent
      onLoginSuccess(data.token, data.teacher);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background design elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-md w-full space-y-8 animate-fade-in relative z-15">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/30 mb-4">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">AttendEase</h1>
          <p className="text-slate-500 text-xs mt-1.5 font-bold uppercase tracking-wider">
            Smart Attendance & Analytics Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-slate-100/80 shadow-xl shadow-slate-100">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-slate-800">Faculty Log In</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Please enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {errorMsg && (
              <div className="flex gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-800 font-semibold leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Faculty Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-700/20 hover:shadow-xl transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          {/* Demo account credential hints */}
          <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100/40 rounded-2xl text-left space-y-1">
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">Demo Access Accounts</span>
            <div className="text-[11px] text-slate-500 font-medium">
              Email: <span className="font-mono text-slate-700 font-bold">teacher@attendease.com</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Password: <span className="font-mono text-slate-700 font-bold">password123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
