const express = require('express');
const multer = require('multer');
const s3 = require('../services/s3Service');
const Media = require('../models/Media');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Tipo de archivo no permitido'));
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
            uploadedBy: req.user?.id || 'unknown'
        });

        await media.save();

        res.json({ success: true, media });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Fallo en la subida', message: err.message });
    }
});

// GET por ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).json({ error: 'Media no encontrada' });
        res.json(media);
    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ error: 'Fallo al obtener media' });
    }
});

// LISTAR
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
        res.status(500).json({ error: 'Fallo al listar' });
    }
});

// DELETE
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).json({ error: 'Media no encontrada' });

        await s3.deleteObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: media.url.split('/').pop()
        }).promise();

        await Media.deleteOne({ _id: req.params.id });

        res.json({ success: true, message: 'Media eliminada' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Fallo al eliminar' });
    }
});

module.exports = router;
