const DealerBill = require('../models/DealerBill');

// Update or create a payment against a bill
exports.updatePayment = async (req, res) => {
  try {
    const { billId, paidAmount } = req.body;
    if (paidAmount < 0) {
      return res.status(400).json({ message: 'Paid amount cannot be negative' });
    }

    // Find the bill and update it
    const bill = await DealerBill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Calculate new balance and update the bill
    bill.paidAmount += paidAmount; // Assuming you want to add to the existing paid amount
    bill.balance = bill.amount - bill.paidAmount;
    bill.status = bill.balance <= 0 ? 'Completed' : 'Pending';
    bill.updated_at = Date.now(); // Update the modification time

    await bill.save();

    res.json({
      message: 'Payment updated successfully',
      bill,
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error while updating payment', error: error.message });
  }
};

// Get all bills with their payment details
exports.getAllBills = async (req, res) => {
  try {
    const bills = await DealerBill.find();
    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Server error while fetching bills', error: error.message });
  }
};

// Get a specific bill by ID
exports.getBillById = async (req, res) => {
  try {
    const bill = await DealerBill.findById(req.params.billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ message: 'Server error while fetching bill', error: error.message });
  }
};
