const express = require('express');
const router = express.Router();
const { updateTableStatus } = require('../controllers/tableController');

router.put('/:id', updateTableStatus);

module.exports = router;