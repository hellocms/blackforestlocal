const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require('../controllers/userController');

router.post('/login', authController.login);
router.post('/register', authController.register); // ✅ No auth middleware
router.get('/users', auth(['superadmin']), authController.getUsers);
router.put('/users/:id', auth(['superadmin']), authController.updateUser);
router.put('/users/:id/toggle', auth(['superadmin']), authController.toggleUserStatus); // ✅ Toggle status
router.delete('/users/:id', auth(['superadmin']), authController.deleteUser);

module.exports = router;
