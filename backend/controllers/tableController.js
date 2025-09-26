const Table = require('../models/Table');

// Update table status
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentOrder } = req.body;

    // Validate inputs
    if (!status || !['Free', 'Occupied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "Free" or "Occupied"' });
    }

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    table.status = status;
    table.currentOrder = currentOrder || null;
    await table.save();

    res.status(200).json({ message: 'Table status updated successfully', table });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ message: 'Error updating table status', error: error.message });
  }
};

module.exports = { updateTableStatus };