import { useState } from 'react';
import { Layers, Plus, Trash2, Users, AlertCircle, BookOpen } from 'lucide-react';

export default function Branches({ branches, students, onAddBranch, onDeleteBranch }) {
  const studentList = students || [];
  const [newBranchName, setNewBranchName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const name = newBranchName.trim();
    if (!name) {
      setError('Branch name cannot be empty.');
      return;
    }

    // Client-side duplicate check
    if (branches.some(b => b.name.toLowerCase() === name.toLowerCase())) {
      setError(`Branch "${name}" already exists.`);
      return;
    }

    setLoading(true);
    try {
      await onAddBranch(name);
      setNewBranchName('');
    } catch (err) {
      setError(err.message || 'Failed to add branch.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId, branchName) => {
    setError(null);
    
    // Check if branch has students enrolled
    const studentCount = studentList.filter(
      s => s.course.toLowerCase() === branchName.toLowerCase()
    ).length;

    if (studentCount > 0) {
      setError(`Cannot delete "${branchName}" because there are ${studentCount} student(s) currently enrolled in this branch. Please reassign or delete these students first.`);
      return;
    }

    if (confirm(`Are you sure you want to delete the branch "${branchName}"?`)) {
      try {
        await onDeleteBranch(branchId);
      } catch (err) {
        setError(err.message || 'Failed to delete branch.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Branches & Sections</h1>
        <p className="text-slate-500 mt-1">Configure academic branches, create sections (e.g. BCA-A, BCA-B), and monitor enrollment stats.</p>
      </div>

      {error && (
        <div className="flex gap-2.5 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-800 shadow-sm shadow-rose-500/5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <div className="font-semibold leading-relaxed">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Create Branch Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-500" />
            Add New Branch / Section
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter a section code or name (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-600">BCA-A</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-600">BCA-B</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-600">BSC-CS-B</code>). It will be available immediately as a dropdown choice in the Student Directory.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. BCA-B"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Create Branch'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Branches List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Academic Sections ({branches.length})</h3>

          {branches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
              <Layers className="w-12 h-12 text-slate-200 mb-2" />
              <h4 className="text-slate-500 font-medium">No branches configured yet</h4>
              <p className="text-slate-400 text-xs mt-1">Add a new academic branch on the left to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map((branch) => {
                const enrollmentCount = studentList.filter(
                  s => s.course.toLowerCase() === branch.name.toLowerCase()
                ).length;

                return (
                  <div
                    key={branch._id}
                    className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-800 text-base truncate" title={branch.name}>
                          {branch.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{enrollmentCount} Student{enrollmentCount !== 1 ? 's' : ''} Enrolled</span>
                      </div>
                    </div>

                    {enrollmentCount > 0 ? (
                      <button
                        disabled
                        className="p-2.5 bg-slate-50 text-slate-300 rounded-xl border border-slate-100 flex-shrink-0 cursor-not-allowed opacity-60"
                        title={`Cannot delete "${branch.name}" because ${enrollmentCount} students are enrolled.`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(branch._id, branch.name)}
                        className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-slate-100 hover:border-rose-100 flex-shrink-0"
                        title={`Delete ${branch.name}`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
