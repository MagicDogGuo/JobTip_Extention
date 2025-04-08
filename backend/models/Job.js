const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  jobUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  salary: {
    type: String,
    default: ''
  },
  jobType: {
    type: String,
    default: ''
  },
  platform: {
    type: String,
    required: true,
    enum: ['LinkedIn', 'Indeed', 'SEEK']
  },
  postedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema); 