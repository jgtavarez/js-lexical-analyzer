// Express server to serve the web interface
const express = require('express');
const path = require('path');
const Compiler = require('./compiler');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// API endpoint for compiling JavaScript code
app.post('/api/compile', (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No JavaScript code provided' });
    }
    
    const compiler = new Compiler();
    const result = compiler.compile(code);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Compilation failed' });
  }
});

// Serve the index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 