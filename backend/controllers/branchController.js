import { db } from '../config/db.js';

// Get all branches
export const getBranches = async (req, res) => {
  try {
    const branches = await db.getBranches();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving branches', error: error.message });
  }
};

// Add a new branch
export const addBranch = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Branch name is required.' });
  }

  try {
    const newBranch = await db.addBranch({ name: name.trim() });
    res.status(201).json(newBranch);
  } catch (error) {
    if (error.message.includes('Duplicate branch name')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error adding branch', error: error.message });
  }
};

// Delete a branch
export const deleteBranch = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if any student is currently enrolled in this branch before deleting
    const branches = await db.getBranches();
    const branchToDelete = branches.find(b => b._id.toString() === id);
    
    if (!branchToDelete) {
      return res.status(404).json({ message: 'Branch not found.' });
    }

    const students = await db.getStudents();
    const hasStudents = students.some(
      s => s.course.toLowerCase() === branchToDelete.name.toLowerCase()
    );

    if (hasStudents) {
      return res.status(400).json({ 
        message: `Cannot delete branch "${branchToDelete.name}" because students are still enrolled in it.` 
      });
    }

    await db.deleteBranch(id);
    res.json({ message: 'Branch deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting branch', error: error.message });
  }
};
