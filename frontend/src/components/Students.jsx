import { useState } from 'react';
import { Search, UserPlus, Edit2, Trash2, Mail, Hash, BookOpen, AlertCircle, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Students({ students, branches = [], onAddStudent, onUpdateStudent, onDeleteStudent, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentStudentId, setCurrentStudentId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Extract unique courses for filtering
  const courses = ['All', ...branches.map(b => b.name)];


  // Filter and search students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCourse = courseFilter === 'All' || student.course === courseFilter;
    
    return matchesSearch && matchesCourse;
  });

  // Paginated Slicing
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const openAddModal = () => {
    setModalMode('add');
    setName('');
    setRollNumber('');
    setEmail('');
    setCourse('');
    setErrorMsg('');
    setCurrentStudentId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setModalMode('edit');
    setName(student.name);
    setRollNumber(student.rollNumber);
    setEmail(student.email || '');
    setCourse(student.course);
    setErrorMsg('');
    setCurrentStudentId(student._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !rollNumber.trim() || !course.trim()) {
      setErrorMsg('Name, Roll Number, and Course are required fields.');
      return;
    }

    const payload = {
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      email: email.trim() || undefined,
      course: course.trim()
    };

    try {
      if (modalMode === 'add') {
        await onAddStudent(payload);
        if (showToast) showToast(`Student "${payload.name}" added successfully.`, 'success');
      } else {
        await onUpdateStudent(currentStudentId, payload);
        if (showToast) showToast(`Student details updated.`, 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Are you sure you want to delete ${name}? This will also delete their attendance history.`)) {
      try {
        await onDeleteStudent(id);
        if (showToast) showToast(`Student "${name}" deleted successfully.`, 'success');
      } catch (err) {
        if (showToast) showToast(err.message || 'Failed to delete student.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Student Directory</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage student profiles, enrollment courses, and contact information.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name, roll number, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Course Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Course:</label>
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-semibold"
          >
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List Grid/Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredStudents.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Roll Number</th>
                    <th className="py-4 px-6">Course / Class</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-800">{student.name}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                        <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-150 font-semibold">
                          {student.rollNumber}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-indigo-50/50 border border-indigo-100/30 px-2.5 py-1 rounded-full text-xs font-medium">
                          <BookOpen className="w-3 h-3 text-indigo-500" />
                          {student.course}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {student.email ? (
                          <a href={`mailto:${student.email}`} className="flex items-center gap-1.5 hover:text-indigo-600 hover:underline">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{student.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 italic text-xs">No email provided</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-all cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student._id, student.name)}
                            className="p-2 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs text-slate-500 font-semibold">
                  Showing <span className="text-slate-800 font-bold">{startIndex + 1}</span> to{' '}
                  <span className="text-slate-800 font-bold">
                    {Math.min(startIndex + itemsPerPage, filteredStudents.length)}
                  </span>{' '}
                  of <span className="text-slate-800 font-bold">{filteredStudents.length}</span> students
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 disabled:opacity-40 shadow-sm cursor-pointer transition-all disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const isCurrent = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent 
                              ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20' 
                              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 disabled:opacity-40 shadow-sm cursor-pointer transition-all disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Search className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">No students match your query</p>
            <p className="text-slate-400 text-xs mt-1">Try clearing search filters or add a new student above.</p>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">
                {modalMode === 'add' ? 'Add New Student' : 'Edit Student Details'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="flex gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Roll Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Roll Number *</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-105"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="e.g. john@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Course */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Class / Course *</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                  <select
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="" disabled>-- Select Branch / Section --</option>
                    {branches.map(b => (
                      <option key={b._id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                {branches.length === 0 && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">
                    ⚠️ No branches configured. Please add a branch first in the Branches section.
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{modalMode === 'add' ? 'Save Student' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

