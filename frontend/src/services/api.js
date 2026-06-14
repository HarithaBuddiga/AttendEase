// AttendEase API Service Layer

const getHeaders = (isJson = true) => {
  const token = localStorage.getItem('attendease_token');
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication API
  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return await res.json();
  },

  // Students API
  async getStudents() {
    const res = await fetch('/api/students', {
      headers: getHeaders(false)
    });
    if (!res.ok) {
      throw new Error('Failed to fetch students');
    }
    return await res.json();
  },

  async addStudent(student) {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(student)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to add student');
    }
    return await res.json();
  },

  async updateStudent(id, student) {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(student)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update student');
    }
    return await res.json();
  },

  async deleteStudent(id) {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });
    if (!res.ok) {
      throw new Error('Failed to delete student');
    }
    return await res.json();
  },

  // Attendance API
  async getAttendance() {
    const res = await fetch('/api/attendance', {
      headers: getHeaders(false)
    });
    if (!res.ok) {
      throw new Error('Failed to fetch attendance records');
    }
    return await res.json();
  },

  async getAttendanceByDate(date) {
    const res = await fetch(`/api/attendance/${date}`, {
      headers: getHeaders(false)
    });
    if (!res.ok) {
      throw new Error('Failed to fetch attendance for selected date');
    }
    return await res.json();
  },

  async saveAttendance(date, records) {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ date, records })
    });
    if (!res.ok) {
      throw new Error('Failed to save attendance');
    }
    return await res.json();
  },

  // Status & Utility APIs
  async getStatus() {
    const res = await fetch('/api/status', {
      headers: getHeaders(false)
    });
    if (!res.ok) {
      throw new Error('Failed to fetch database connection status');
    }
    return await res.json();
  },

  async seedData() {
    const res = await fetch('/api/seed', {
      method: 'POST',
      headers: getHeaders(false)
    });
    if (!res.ok) {
      throw new Error('Failed to seed mock database records');
    }
    return await res.json();
  },

  // Branches API
  async getBranches() {
    const res = await fetch('/api/branches', {
      headers: getHeaders(false)
    });
    if (!res.ok) {
      throw new Error('Failed to fetch branches');
    }
    return await res.json();
  },

  async addBranch(branch) {
    const res = await fetch('/api/branches', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(branch)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to add branch');
    }
    return await res.json();
  },

  async deleteBranch(id) {
    const res = await fetch(`/api/branches/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to delete branch');
    }
    return await res.json();
  }
};
