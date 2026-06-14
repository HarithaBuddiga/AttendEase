import { useState } from 'react';
import { Database, Sparkles, Check, Server, Shield, ToggleRight } from 'lucide-react';

export default function Settings({ threshold, onUpdateThreshold, dbStatus, onTriggerSeed, showToast }) {
  const [sliderVal, setSliderVal] = useState(threshold);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleThresholdSave = (e) => {
    e.preventDefault();
    onUpdateThreshold(Number(sliderVal));
    if (showToast) {
      showToast(`Rule updated: low attendance alert limit set to ${sliderVal}%.`, 'success');
    }
  };

  const handleSeedClick = async () => {
    if (confirm('Warning: Seeding mock data will reset your current students list and attendance records. Do you want to proceed?')) {
      setSeedLoading(true);
      setSeedSuccess(false);
      try {
        await onTriggerSeed();
        setSeedSuccess(true);
        if (showToast) {
          showToast('Mock database records populated successfully!', 'success');
        }
        setTimeout(() => setSeedSuccess(false), 5000);
      } catch (err) {
        if (showToast) {
          showToast(`Failed to seed mock data: ${err.message}`, 'error');
        }
      } finally {
        setSeedLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-1">Configure attendance threshold limits, audit database adapters, and generate test data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Configuration Settings */}
        <div className="space-y-6">
          {/* Threshold Setup */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ToggleRight className="w-5 h-5 text-indigo-500" />
              Attendance Rules
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Set the minimum percentage of attendance that students are expected to maintain. Students below this value will trigger warnings in the Reports tab.
            </p>

            <form onSubmit={handleThresholdSave} className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Low Attendance Alert Limit</span>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">{sliderVal}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={sliderVal}
                  onChange={(e) => setSliderVal(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer text-center"
              >
                Save Configuration
              </button>
            </form>
          </div>

          {/* Seed Demo Data Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4 relative overflow-hidden">
            {/* Background design glow */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Quick Demo Seeding
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Reset the database and populate it with 10 students across various courses (Computer Science, Math, Engineering) and 20 days of mock attendance records. This creates dynamic percentages and alerts for instant evaluation.
            </p>

            <div className="pt-2">
              <button
                onClick={handleSeedClick}
                disabled={seedLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {seedLoading ? 'Generating records...' : 'Populate Mock Data'}
              </button>
              
              {seedSuccess && (
                <div className="mt-3 flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 font-medium animate-fade-in justify-center">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>Success! 10 students and 210 attendance logs generated.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Database Infrastructure Status */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              System Architecture
            </h3>

            <div className="space-y-4">
              {/* Active Connection adapter info */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${dbStatus?.dbType?.includes('MongoDB') ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Active Engine</div>
                    <div className="text-sm font-bold text-slate-700">{dbStatus?.dbType || 'Checking...'}</div>
                  </div>
                </div>
                
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100/50 font-bold px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span>ONLINE</span>
                </span>
              </div>

              {/* Security Shield Info */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Environment</div>
                  <div className="text-xs text-slate-500 leading-normal">
                    Adapter fallback active. Set MONGODB_URI in backend environment file to use cloud atlas database.
                  </div>
                </div>
              </div>

              {/* Database stats */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Database Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Students In DB</div>
                    <div className="text-xl font-black text-slate-700 mt-1">{dbStatus?.studentsCount ?? 0}</div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Logs In DB</div>
                    <div className="text-xl font-black text-slate-700 mt-1">{dbStatus?.attendanceCount ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
