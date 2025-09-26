const Album = require('../models/Album');

// ✅ Create New Album
exports.createAlbum = async (req, res) => {
  try {
    console.log("🔥 Incoming Request Body:", req.body);

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Album name is required" });
    }

    // ✅ Check if album already exists (Case-Insensitive)
    const existingAlbum = await Album.findOne({ name: { $regex: new RegExp("^" + name + "$", "i") } });
    if (existingAlbum) {
      return res.status(400).json({ message: "❌ Album name already exists! Choose a different name." });
    }

    const newAlbum = new Album({ name, enabled: true }); // ✅ Save "enabled" as true by default
    await newAlbum.save();

    res.status(201).json({ message: "✅ Album created successfully", album: newAlbum });
  } catch (error) {
    console.error("❌ Error creating album:", error);
    res.status(500).json({ message: "Error creating album", error: error.message });
  }
};



// ✅ Get All Albums
exports.getAlbums = async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.status(200).json(albums);
  } catch (error) {
    console.error("❌ Error fetching albums:", error);
    res.status(500).json({ message: "Error fetching albums", error: error.message });
  }
};

// ✅ Get Single Album by ID
exports.getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    res.status(200).json(album);
  } catch (error) {
    console.error("❌ Error fetching album:", error);
    res.status(500).json({ message: "Error fetching album", error: error.message });
  }
};

// ✅ Update Album by ID
exports.updateAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;

    if (!albumId || albumId.length !== 24) {
      return res.status(400).json({ message: "Invalid or missing album ID" });
    }

    const { name, enabled } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Album name is required" });
    }

    // ✅ Check if another album with the same name exists (excluding the current album)
    const existingAlbum = await Album.findOne({ 
      name: { $regex: new RegExp("^" + name + "$", "i") }, 
      _id: { $ne: albumId } // Exclude the current album from duplicate check
    });

    if (existingAlbum) {
      return res.status(400).json({ message: "❌ Album name already exists! Choose a different name." });
    }

    const updatedAlbum = await Album.findByIdAndUpdate(albumId, { name, enabled }, { new: true });

    if (!updatedAlbum) {
      return res.status(404).json({ message: "Album not found" });
    }

    res.status(200).json({ message: "✅ Album updated successfully", album: updatedAlbum });
  } catch (error) {
    console.error("❌ Error updating album:", error);
    res.status(500).json({ message: "Error updating album", error: error.message });
  }
};


// ✅ Delete Album by ID
exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    await Album.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "✅ Album deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting album:", error);
    res.status(500).json({ message: "Error deleting album", error: error.message });
  }
};

exports.toggleAlbumStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    album.enabled = !album.enabled; // ✅ Toggle "enabled" state
    await album.save();

    res.status(200).json({ message: `Album ${album.enabled ? "enabled" : "disabled"} successfully`, album });
  } catch (error) {
    console.error("❌ Error toggling album status:", error);
    res.status(500).json({ message: "Error updating album status", error: error.message });
  }
};
