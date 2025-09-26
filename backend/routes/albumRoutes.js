const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');

// ✅ Create Album
router.post("/albums", albumController.createAlbum);

// ✅ Get All Albums
router.get("/albums", albumController.getAlbums);

// ✅ Get Album by ID
router.get("/albums/:id", albumController.getAlbumById);

// ✅ Update Album by ID
router.put("/albums/:id", albumController.updateAlbum);

// ✅ Delete Album by ID
router.delete("/albums/:id", albumController.deleteAlbum);

router.put("/albums/:id/toggle-status", albumController.toggleAlbumStatus);


module.exports = router;
