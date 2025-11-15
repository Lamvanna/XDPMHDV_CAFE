const express = require('express');
const path = require('path');

const app = express();
const PORT = 5500;

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Frontend: http://localhost:${PORT}`);
});
