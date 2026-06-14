import { db } from '../config/db.js';

// Get attendance records for a specific date
export const getAttendanceByDate = async (req, res) => {
  const { date } = req.params;

  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }

  try {
    const records = await db.getAttendanceRecords(date);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving attendance records', error: error.message });
  }
};

// Get all attendance records
export const getAllAttendance = async (req, res) => {
  try {
    const records = await db.getAllAttendance();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving all attendance records', error: error.message });
  }
};

// Save attendance records for a specific date
export const saveAttendance = async (req, res) => {
  const { date, records } = req.body;

  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Date and records array are required.' });
  }

  try {
    const updatedRecords = await db.saveAttendance(date, records);
    res.status(201).json(updatedRecords);
  } catch (error) {
    res.status(500).json({ message: 'Error saving attendance records', error: error.message });
  }
};
