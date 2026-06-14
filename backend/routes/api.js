import express from 'express';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { getAttendanceByDate, getAllAttendance, saveAttendance } from '../controllers/attendanceController.js';
import { getBranches, addBranch, deleteBranch } from '../controllers/branchController.js';
import { login } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { db } from '../config/db.js';

const router = express.Router();

// Public Authentication Routes
router.post('/auth/login', login);

// Student Routes (Protected)
router.get('/students', protect, getStudents);
router.post('/students', protect, addStudent);
router.put('/students/:id', protect, updateStudent);
router.delete('/students/:id', protect, deleteStudent);

// Attendance Routes (Protected)
router.get('/attendance', protect, getAllAttendance);
router.post('/attendance', protect, saveAttendance);
router.get('/attendance/:date', protect, getAttendanceByDate);

// Branch Routes (Protected)
router.get('/branches', protect, getBranches);
router.post('/branches', protect, addBranch);
router.delete('/branches/:id', protect, deleteBranch);

// Status route (Protected)
router.get('/status', protect, async (req, res) => {
  try {
    const students = await db.getStudents();
    const attendance = await db.getAllAttendance();
    const branches = await db.getBranches();
    res.json({
      dbType: db.isMongoDB() ? 'MongoDB Atlas' : 'Local JSON File',
      isMongoActive: db.isMongoActive(),
      studentsCount: students.length,
      attendanceCount: attendance.length,
      branchesCount: branches.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking status', error: error.message });
  }
});

// Seed mockup data (Protected)
router.post('/seed', protect, async (req, res) => {
  try {
    const result = await db.seedMockData();
    res.json({ message: 'Database seeded with mock data successfully!', result });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding database', error: error.message });
  }
});

export default router;
