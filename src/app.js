require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const mediaRoutes = require('./routes/mediaRoutes');

const app = express();
const PORT = process.env.PORT || 3008;

app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB error:', err);
});

app.use('/media', mediaRoutes);

app.listen(PORT, () => {
    console.log(`Media Service running on port ${PORT}`);
});
