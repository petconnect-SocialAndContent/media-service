const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    filename: String,
    url: String,
    contentType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: String
}, { timestamps: true });

module.exports = mongoose.model('Media', MediaSchema);
