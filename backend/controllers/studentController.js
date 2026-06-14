import { db } from '../config/db.js';

// Get all students
export const getStudents = async (req, res) => {
  try {
    const students = await db.getStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving students', error: error.message });
  }
};

// Add a new student
export const addStudent = async (req, res) => {
  const { name, rollNumber, email, course } = req.body;

  if (!name || !rollNumber || !course) {
    return res.status(400).json({ message: 'Name, roll number, and course are required.' });
  }

  try {
    const newStudent = await db.addStudent({ name, rollNumber, email, course });
    res.status(201).json(newStudent);
  } catch (error) {
    if (error.message.includes('Duplicate roll number')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
};

// Update a student
export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, rollNumber, email, course } = req.body;

  if (!name || !rollNumber || !course) {
    return res.status(400).json({ message: 'Name, roll number, and course are required.' });
  }

  try {
    const updatedStudent = await db.updateStudent(id, { name, rollNumber, email, course });
    res.json(updatedStudent);
  } catch (error) {
    if (error.message.includes('Student not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Duplicate roll number')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

// Delete a student
export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    await db.deleteStudent(id);
    res.json({ message: 'Student and related attendance history deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};
