const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    filename: String,
    url: String,
    contentType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: String // userId que subió el archivo
});

module.exports = mongoose.model('Media', MediaSchema);
