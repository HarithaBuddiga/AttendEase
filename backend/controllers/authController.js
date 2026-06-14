import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'attendease_secret_key_12345';

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const teacher = await db.getTeacherByEmail(email);
    if (!teacher) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: teacher._id, email: teacher.email, name: teacher.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      teacher: {
        email: teacher.email,
        name: teacher.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};
