const express = require('express');
const multer = require('multer');
const s3 = require('../services/s3Service.js');
const Media = require('../models/Media.js');
const authMiddleware = require('../middleware/authMiddleware.js'); // auth básico

const router = express.Router();

// Validaciones: tipos y tamaño (ejemplo: máx 5MB y solo imágenes)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'));
        }
    }
});

// SUBIR
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
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
        res.status(500).json({ error: 'Failed to upload', message: err.message });
    }
});

// GET por ID
router.get('/:id', authMiddleware, async (req, res) => {
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

// LISTAR paginado
router.get('/', authMiddleware, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const mediaList = await Media.find()
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Media.countDocuments();

        res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            items: mediaList
        });
    } catch (err) {
        console.error('List error:', err);
        res.status(500).json({ error: 'Failed to list media' });
    }
});

// BORRAR por ID
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        // borrar en S3
        const s3Params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: media.url.split('/').pop()
        };

        await s3.deleteObject(s3Params).promise();

        // borrar en Mongo
        await Media.deleteOne({ _id: req.params.id });

        res.json({ success: true, message: 'Media deleted' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete media' });
    }
});

module.exports = router;
