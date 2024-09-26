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

// Define schemas and models
const BlindSchema = new mongoose.Schema({
  status: String,
  humidity: Number,
  light_level: Number,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const CommandSchema = new mongoose.Schema({
  command: String,
  timestamp: { type: Date, default: Date.now }
});

const Blind = mongoose.model('Blind', BlindSchema);
const Command = mongoose.model('Command', CommandSchema);

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
  const { status, humidity, light_level } = req.body;
  console.log('Received data:', { status, humidity, light_level });
  try {
    const newBlind = new Blind({ status, humidity, light_level });
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

// API endpoint for manual control
app.post('/api/blinds/control', async (req, res) => {
  const { command } = req.body;
  if (!['open', 'close', 'auto', 'manual'].includes(command)) {
    return res.status(400).json({ message: 'Invalid command' });
  }
  try {
    const newCommand = new Command({ command });
    await newCommand.save();
    res.status(200).json({ message: 'Command received', command });
  } catch (error) {
    console.error('Error saving command:', error);
    res.status(500).json({ message: 'Error saving command', error: error.message });
  }
});

// API endpoint for ESP8266 to check for commands
app.get('/api/blinds/command', async (req, res) => {
  try {
    const latestCommand = await Command.findOne().sort({ timestamp: -1 });
    if (latestCommand) {
      res.status(200).json({ command: latestCommand.command });
      await Command.deleteMany({}); // Clear all commands after sending
    } else {
      res.status(200).json({ command: null });
    }
  } catch (error) {
    console.error('Error fetching command:', error);
    res.status(500).json({ message: 'Error fetching command', error: error.message });
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
