const Dealer = require('../models/Dealer');

exports.createDealer = async (req, res) => {
  try {
    const { dealer_name, address, phone_no, gst, pan, msme, tan } = req.body;

    if (!dealer_name || !phone_no) {
      return res.status(400).json({ message: 'Dealer name and phone number are required' });
    }

    const existingDealerByPhone = await Dealer.findOne({ phone_no });
    if (existingDealerByPhone) {
      return res.status(400).json({ message: 'Phone number already exists', field: 'phone_no' });
    }

    const existingDealerByGst = await Dealer.findOne({ gst: { $exists: true, $ne: null, $eq: gst } });
    if (existingDealerByGst) {
      return res.status(400).json({ message: 'GST already exists', field: 'gst' });
    }

    const dealer = new Dealer({
      dealer_name,
      address,
      phone_no,
      gst,
      pan,
      msme,
      tan,
    });

    const savedDealer = await dealer.save();
    res.status(201).json({ message: 'Dealer created successfully', dealer: savedDealer });
  } catch (error) {
    console.error('Error creating dealer:', error);
    if (error.code === 11000) {
      const field = error.message.includes('phone_no') ? 'phone_no' : 'gst';
      return res.status(400).json({ message: `${field === 'phone_no' ? 'Phone number' : 'GST'} already exists`, field });
    }
    res.status(500).json({ message: 'Server error while creating dealer', error: error.message });
  }
};

exports.getDealers = async (req, res) => {
  try {
    const dealers = await Dealer.find();
    res.status(200).json(dealers);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    res.status(500).json({ message: 'Server error while fetching dealers', error: error.message });
  }
};

exports.getDealerById = async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = await Dealer.findById(id);
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    res.status(200).json(dealer);
  } catch (error) {
    console.error('Error fetching dealer:', error);
    res.status(500).json({ message: 'Server error while fetching dealer', error: error.message });
  }
};

exports.updateDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const { dealer_name, address, phone_no, gst, pan, msme, tan } = req.body;

    if (!dealer_name || !phone_no) {
      return res.status(400).json({ message: 'Dealer name and phone number are required' });
    }

    // Check for duplicate phone_no or gst (excluding the current dealer)
    const existingDealerByPhone = await Dealer.findOne({ phone_no, _id: { $ne: id } });
    if (existingDealerByPhone) {
      return res.status(400).json({ message: 'Phone number already exists', field: 'phone_no' });
    }

    const existingDealerByGst = await Dealer.findOne({ gst: { $exists: true, $ne: null, $eq: gst }, _id: { $ne: id } });
    if (existingDealerByGst) {
      return res.status(400).json({ message: 'GST already exists', field: 'gst' });
    }

    const updatedDealer = await Dealer.findByIdAndUpdate(
      id,
      { dealer_name, address, phone_no, gst, pan, msme, tan, updated_at: Date.now() },
      { new: true }
    );

    if (!updatedDealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    res.status(200).json({ message: 'Dealer updated successfully', dealer: updatedDealer });
  } catch (error) {
    console.error('Error updating dealer:', error);
    if (error.code === 11000) {
      const field = error.message.includes('phone_no') ? 'phone_no' : 'gst';
      return res.status(400).json({ message: `${field === 'phone_no' ? 'Phone number' : 'GST'} already exists`, field });
    }
    res.status(500).json({ message: 'Server error while updating dealer', error: error.message });
  }
};

exports.deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDealer = await Dealer.findByIdAndDelete(id);
    if (!deletedDealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    res.status(200).json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Error deleting dealer:', error);
    res.status(500).json({ message: 'Server error while deleting dealer', error: error.message });
  }
};