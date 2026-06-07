const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Basic test route (unprotected health check)
app.get('/', (req, res) => {
  res.send('Auto Consult API is running!');
});

// Import and use routes (protected by authentication middleware)
app.use('/api/cars', authMiddleware, require('./routes/cars'));
app.use('/api/customers', authMiddleware, require('./routes/customers'));
app.use('/api/finance', authMiddleware, require('./routes/finance'));
app.use('/api/documents', authMiddleware, require('./routes/documents'));
app.use('/api/erp', authMiddleware, require('./routes/erp'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
