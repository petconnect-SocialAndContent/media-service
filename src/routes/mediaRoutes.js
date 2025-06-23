const express = require('express');
const multer = require('multer');
const s3 = require('../services/s3Service.js');
const Media = require('../models/Media.js');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: Date.now() + '-' + file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
    };

    try {
        const s3Response = await s3.upload(s3Params).promise();

        const media = new Media({
            filename: file.originalname,
            url: s3Response.Location,
            contentType: file.mimetype,
            size: file.size,
            uploadedBy: req.body.userId || 'unknown'
        });

        await media.save();

        res.json({ success: true, media });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Failed to upload' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        res.json(media);
    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});

module.exports = router;
