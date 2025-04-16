const express = require('express');
const app = express();

// Simple endpoint
app.get('/', (req, res) => {
  res.send('Hello from genai-demo-app!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const query = "SELECT * FROM users WHERE id=" + userId;
