const express = require('express');
const router = express.Router();
const DailyAssignments = require('../models/DailyAssignments');
const auth = require('../middleware/auth');

// Get today's assignment for a branch
router.get('/:branchId/today', auth(['branch']), async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const assignment = await DailyAssignments.findOne({ branchId, date: today })
      .populate('cashierId', 'name') // Populate cashier name
      .populate('managerId', 'name'); // Populate manager name

    res.status(200).json(assignment || {});
  } catch (error) {
    console.error('Error fetching daily assignment:', error);
    res.status(500).json({ message: 'Error fetching daily assignment', error: error.message });
  }
});

// Save or update today's assignment for a branch
router.post('/:branchId', auth(['branch']), async (req, res) => {
  try {
    const { cashierId, managerId } = req.body;
    const branchId = req.params.branchId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    let assignment = await DailyAssignments.findOne({ branchId, date: today });
    if (!assignment) {
      assignment = new DailyAssignments({ branchId, date: today });
    }

    if (cashierId) assignment.cashierId = cashierId;
    if (managerId) assignment.managerId = managerId;

    await assignment.save();

    const updatedAssignment = await DailyAssignments.findOne({ branchId, date: today })
      .populate('cashierId', 'name')
      .populate('managerId', 'name');

    res.status(200).json({ message: 'Assignment saved successfully', assignment: updatedAssignment });
  } catch (error) {
    console.error('Error saving daily assignment:', error);
    res.status(500).json({ message: 'Error saving daily assignment', error: error.message });
  }
});

// New route: Get assignment by branch and specific date
router.get('/:branchId/by-date/:date', auth(['branch', 'admin', 'superadmin']), async (req, res) => {
  try {
    const { branchId, date } = req.params; // date in YYYY-MM-DD format
    const assignment = await DailyAssignments.findOne({ branchId, date })
      .populate('cashierId', 'name')
      .populate('managerId', 'name');

    res.status(200).json(assignment || {});
  } catch (error) {
    console.error('Error fetching assignment by date:', error);
    res.status(500).json({ message: 'Error fetching assignment by date', error: error.message });
  }
});

module.exports = router;