import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

let isMongo = false;

// Schemas for Mongoose
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  email: { type: String },
  course: { type: String, required: true }
});

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  present: { type: Boolean, required: true }
});

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

const teacherSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Teacher Account' }
});

const MongoStudent = mongoose.models.Student || mongoose.model('Student', studentSchema);
const MongoAttendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
const MongoBranch = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
const MongoTeacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

// JSON DB Initial State
const initialDb = {
  students: [],
  attendance: [],
  branches: [],
  teachers: []
};

// Helper for local JSON DB
function readLocalDb() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.branches) parsed.branches = [];
    if (!parsed.teachers) parsed.teachers = [];
    return parsed;
  } catch (err) {
    console.error('Error reading local database file, resetting...', err);
    return initialDb;
  }
}

function writeLocalDb(data) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
}

// Connect function
export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('⚠️  No MONGODB_URI found in environment. Falling back to local JSON database.');
    isMongo = false;
    readLocalDb(); // Ensure folder and file exist
    await db.seedDefaultTeacher();
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');
    isMongo = true;
    await db.seedDefaultTeacher();
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB. Falling back to local JSON database. Error:', err.message);
    isMongo = false;
    readLocalDb();
    await db.seedDefaultTeacher();
  }
}

// Unified Database API
export const db = {
  // Students
  async getStudents() {
    if (isMongo) {
      return await MongoStudent.find({});
    } else {
      const data = readLocalDb();
      return data.students;
    }
  },

  async addStudent(studentData) {
    if (isMongo) {
      const student = new MongoStudent(studentData);
      return await student.save();
    } else {
      const data = readLocalDb();
      // Simple validation for unique roll number
      if (data.students.some(s => s.rollNumber.toLowerCase() === studentData.rollNumber.toLowerCase())) {
        throw new Error(`Duplicate roll number: ${studentData.rollNumber}`);
      }
      const newStudent = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...studentData
      };
      data.students.push(newStudent);
      writeLocalDb(data);
      return newStudent;
    }
  },

  async updateStudent(id, studentData) {
    if (isMongo) {
      return await MongoStudent.findByIdAndUpdate(id, studentData, { new: true });
    } else {
      const data = readLocalDb();
      const index = data.students.findIndex(s => s._id === id);
      if (index === -1) throw new Error('Student not found');
      
      // Roll number check excluding current student
      if (data.students.some(s => s.rollNumber.toLowerCase() === studentData.rollNumber.toLowerCase() && s._id !== id)) {
        throw new Error(`Duplicate roll number: ${studentData.rollNumber}`);
      }

      data.students[index] = {
        ...data.students[index],
        ...studentData
      };
      writeLocalDb(data);
      return data.students[index];
    }
  },

  async deleteStudent(id) {
    if (isMongo) {
      await MongoStudent.findByIdAndDelete(id);
      await MongoAttendance.deleteMany({ studentId: id });
      return { success: true };
    } else {
      const data = readLocalDb();
      data.students = data.students.filter(s => s._id !== id);
      data.attendance = data.attendance.filter(a => a.studentId !== id);
      writeLocalDb(data);
      return { success: true };
    }
  },

  // Attendance
  async getAttendanceRecords(date) {
    if (isMongo) {
      return await MongoAttendance.find({ date }).populate('studentId');
    } else {
      const data = readLocalDb();
      const records = data.attendance.filter(a => a.date === date);
      return records.map(record => ({
        ...record,
        studentId: data.students.find(s => s._id === record.studentId) || { _id: record.studentId, name: 'Unknown Student', rollNumber: 'N/A' }
      }));
    }
  },

  async getAllAttendance() {
    if (isMongo) {
      return await MongoAttendance.find({}).populate('studentId');
    } else {
      const data = readLocalDb();
      return data.attendance.map(record => ({
        ...record,
        studentId: data.students.find(s => s._id === record.studentId) || { _id: record.studentId, name: 'Unknown Student', rollNumber: 'N/A' }
      }));
    }
  },

  async saveAttendance(date, records) {
    if (isMongo) {
      const bulkOps = records.map(r => ({
        updateOne: {
          filter: { date, studentId: r.studentId },
          update: { date, studentId: r.studentId, present: r.present },
          upsert: true
        }
      }));
      await MongoAttendance.bulkWrite(bulkOps);
      return await MongoAttendance.find({ date }).populate('studentId');
    } else {
      const data = readLocalDb();
      const studentIds = records.map(r => r.studentId);
      data.attendance = data.attendance.filter(a => !(a.date === date && studentIds.includes(a.studentId)));
      
      const newRecords = records.map(r => ({
        _id: new mongoose.Types.ObjectId().toString(),
        date,
        studentId: r.studentId,
        present: r.present
      }));
      
      data.attendance.push(...newRecords);
      writeLocalDb(data);

      return newRecords.map(record => ({
        ...record,
        studentId: data.students.find(s => s._id === record.studentId) || { _id: record.studentId, name: 'Unknown Student', rollNumber: 'N/A' }
      }));
    }
  },

  // Seed mock data for easy demonstration
  async seedMockData() {
    const mockStudents = [
      { name: 'Alice Smith', rollNumber: 'CS-001', email: 'alice@example.com', course: 'Computer Science' },
      { name: 'Bob Johnson', rollNumber: 'CS-002', email: 'bob@example.com', course: 'Computer Science' },
      { name: 'Charlie Brown', rollNumber: 'CS-003', email: 'charlie@example.com', course: 'Computer Science' },
      { name: 'Diana Prince', rollNumber: 'EE-101', email: 'diana@example.com', course: 'Electrical Engineering' },
      { name: 'Ethan Hunt', rollNumber: 'EE-102', email: 'ethan@example.com', course: 'Electrical Engineering' },
      { name: 'Fiona Gallagher', rollNumber: 'ME-201', email: 'fiona@example.com', course: 'Mechanical Engineering' },
      { name: 'George Clark', rollNumber: 'ME-202', email: 'george@example.com', course: 'Mechanical Engineering' },
      { name: 'Hannah Abbott', rollNumber: 'CS-004', email: 'hannah@example.com', course: 'Computer Science' },
      { name: 'Ian Malcolm', rollNumber: 'MATH-301', email: 'ian@example.com', course: 'Mathematics' },
      { name: 'Julia Roberts', rollNumber: 'MATH-302', email: 'julia@example.com', course: 'Mathematics' }
    ];

    const mockBranches = [
      { name: 'Computer Science' },
      { name: 'Electrical Engineering' },
      { name: 'Mechanical Engineering' },
      { name: 'Mathematics' },
      { name: 'BSC-CS-B' }
    ];

    if (isMongo) {
      // Clear existing first
      await MongoStudent.deleteMany({});
      await MongoAttendance.deleteMany({});
      await MongoBranch.deleteMany({});
      
      await MongoBranch.insertMany(mockBranches);
      const savedStudents = await MongoStudent.insertMany(mockStudents);
      await this.generateMockAttendance(savedStudents);
      return { studentsCount: savedStudents.length };
    } else {
      const data = readLocalDb();
      data.students = [];
      data.attendance = [];
      data.branches = [];

      const savedBranches = mockBranches.map(b => ({
        _id: new mongoose.Types.ObjectId().toString(),
        ...b
      }));
      data.branches.push(...savedBranches);

      const savedStudents = mockStudents.map(s => ({
        _id: new mongoose.Types.ObjectId().toString(),
        ...s
      }));

      data.students.push(...savedStudents);
      writeLocalDb(data);

      await this.generateMockAttendance(savedStudents);
      return { studentsCount: savedStudents.length };
    }
  },

  async generateMockAttendance(savedStudents) {
    const dates = [];
    const today = new Date();
    
    // Generate dates for the last 15 days (excluding weekends)
    for (let i = 20; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const day = d.getDay();
      if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
        dates.push(d.toISOString().split('T')[0]);
      }
    }

    const records = [];
    for (const date of dates) {
      for (const student of savedStudents) {
        // Assign random attendance. Let's make CS students attend more, and EE students attend less for demo purposes.
        let presentChance = 0.85; // default 85%
        if (student.rollNumber.startsWith('EE-')) {
          presentChance = 0.65; // EE students 65% (shows low attendance warnings!)
        } else if (student.rollNumber.startsWith('CS-')) {
          presentChance = 0.90; // CS students 90%
        } else if (student.name === 'Charlie Brown') {
          presentChance = 0.505; // Charlie Brown attends 50%
        }

        const present = Math.random() < presentChance;

        records.push({
          _id: new mongoose.Types.ObjectId().toString(),
          date,
          studentId: student._id.toString(),
          present
        });
      }
    }

    if (isMongo) {
      const MongoAttendance = mongoose.model('Attendance');
      await MongoAttendance.insertMany(records.map(r => ({
        date: r.date,
        studentId: new mongoose.Types.ObjectId(r.studentId),
        present: r.present
      })));
    } else {
      const data = readLocalDb();
      data.attendance = records;
      writeLocalDb(data);
    }
  },

  // Branches
  async getBranches() {
    if (isMongo) {
      return await MongoBranch.find({});
    } else {
      const data = readLocalDb();
      return data.branches || [];
    }
  },

  async addBranch(branchData) {
    if (isMongo) {
      const branch = new MongoBranch(branchData);
      return await branch.save();
    } else {
      const data = readLocalDb();
      if (!data.branches) data.branches = [];
      if (data.branches.some(b => b.name.toLowerCase() === branchData.name.toLowerCase())) {
        throw new Error(`Duplicate branch name: ${branchData.name}`);
      }
      const newBranch = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...branchData
      };
      data.branches.push(newBranch);
      writeLocalDb(data);
      return newBranch;
    }
  },

  async deleteBranch(id) {
    if (isMongo) {
      return await MongoBranch.findByIdAndDelete(id);
    } else {
      const data = readLocalDb();
      if (!data.branches) data.branches = [];
      data.branches = data.branches.filter(b => b._id !== id);
      writeLocalDb(data);
      return { success: true };
    }
  },

  isMongoDB() {
    return isMongo;
  },

  isMongoActive() {
    return isMongo;
  },

  async getTeacherByEmail(email) {
    if (isMongo) {
      return await MongoTeacher.findOne({ email });
    } else {
      const data = readLocalDb();
      return data.teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
    }
  },

  async seedDefaultTeacher() {
    const defaultEmail = 'teacher@attendease.com';
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    if (isMongo) {
      const count = await MongoTeacher.countDocuments({});
      if (count === 0) {
        const defaultTeacher = new MongoTeacher({
          email: defaultEmail,
          password: hashedPassword,
          name: 'Teacher Account'
        });
        await defaultTeacher.save();
        console.log('🌱 Default teacher account seeded in MongoDB.');
      }
    } else {
      const data = readLocalDb();
      if (!data.teachers || data.teachers.length === 0) {
        const defaultTeacher = {
          _id: new mongoose.Types.ObjectId().toString(),
          email: defaultEmail,
          password: hashedPassword,
          name: 'Teacher Account'
        };
        data.teachers = [defaultTeacher];
        writeLocalDb(data);
        console.log('🌱 Default teacher account seeded in Local JSON DB.');
      }
    }
  }
};
