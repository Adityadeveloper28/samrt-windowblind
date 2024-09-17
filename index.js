const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Define a schema and model
const BlindSchema = new mongoose.Schema({
  status: String,
  humidity: Number,
  timestamp: String
}, { timestamps: true });

const Blind = mongoose.model('Blind', BlindSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API endpoint to receive data
app.post('/api/blinds', async (req, res) => {
  const { status, humidity, timestamp } = req.body;
  console.log('Received data:', { status, humidity, timestamp });

  try {
    const newBlind = new Blind({ status, humidity, timestamp });
    await newBlind.save();
    console.log('Data saved successfully');
    res.status(201).json({ message: 'Data saved successfully', data: newBlind });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ message: 'Error saving data', error: error.message });
  }
});

// API endpoint to get all data
app.get('/api/blinds', async (req, res) => {
  try {
    const blinds = await Blind.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json(blinds);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});