require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const programmeRoutes = require('./routes/programmeRoutes');
const blockRoutes = require('./routes/blockRoutes');
const roomRoutes = require('./routes/roomRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectDB();

// Routes (supporting both /api/path and /path)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/departments', departmentRoutes);
app.use('/departments', departmentRoutes);

app.use('/api/programmes', programmeRoutes);
app.use('/programmes', programmeRoutes);

app.use('/api/blocks', blockRoutes);
app.use('/blocks', blockRoutes);

app.use('/api/rooms', roomRoutes);
app.use('/rooms', roomRoutes);

app.use('/api/roles', roleRoutes);
app.use('/roles', roleRoutes);

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Complaints
app.use('/api/complaints', complaintRoutes);
app.use('/complaints', complaintRoutes);

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
