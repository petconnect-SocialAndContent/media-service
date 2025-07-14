require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mediaRoutes = require('./routes/mediaRoutes');

const app = express();
const PORT = process.env.PORT || 3008;

app.use(express.json());

// Conexión Mongo
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ MongoDB conectado');
}).catch((err) => {
    console.error('❌ Error MongoDB:', err);
});

// Rutas
app.use('/api/v1/media', mediaRoutes);

// Fallback 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada en media-service' });
});

app.listen(PORT, () => {
    console.log(`📦 media-service corriendo en puerto ${PORT}`);
});
