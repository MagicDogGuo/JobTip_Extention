const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// 獲取所有職位
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ postedDate: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 創建新職位
router.post('/', async (req, res) => {
  try {
    const job = new Job(req.body);
    const savedJob = await job.save();
    res.status(201).json(savedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 批量創建職位
router.post('/batch', async (req, res) => {
  try {
    const jobs = req.body;
    const savedJobs = await Job.insertMany(jobs);
    res.status(201).json(savedJobs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 根據平台獲取職位
router.get('/platform/:platform', async (req, res) => {
  try {
    const jobs = await Job.find({ platform: req.params.platform }).sort({ postedDate: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 搜索職位
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const jobs = await Job.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    }).sort({ postedDate: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 