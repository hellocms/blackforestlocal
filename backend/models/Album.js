const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  enabled: {
    type: Boolean,
    default: true, // ✅ Default to "enabled"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Album', AlbumSchema);
