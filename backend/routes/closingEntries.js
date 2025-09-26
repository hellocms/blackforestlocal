const express = require('express');
const router = express.Router();
const closingEntryController = require('../controllers/closingEntryController');

// Create a new closing entry
router.post('/', closingEntryController.createClosingEntry);

// Update an existing closing entry
router.put('/:id', closingEntryController.updateClosingEntry);

// Create a closing entry from expense sheet
router.post('/expense-sheet', closingEntryController.createExpenseSheetEntry);

// Get all closing entries
router.get('/', closingEntryController.getClosingEntries);

module.exports = router;