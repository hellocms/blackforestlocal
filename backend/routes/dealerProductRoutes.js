const express = require('express');
const router = express.Router();
const dealerProductController = require('../controllers/dealerProductController');

router.post('/', dealerProductController.createDealerProduct);
router.get('/', dealerProductController.getDealerProducts);
router.get('/:id', dealerProductController.getDealerProductById);
router.put('/:id', dealerProductController.updateDealerProduct);
router.delete('/:id', dealerProductController.deleteDealerProduct);

module.exports = router;