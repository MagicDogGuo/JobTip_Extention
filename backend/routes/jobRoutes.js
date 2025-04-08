const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// 测试数据
const testJobs = [
  {
    title: 'Senior Software Engineer',
    company: 'Tech Company A',
    location: 'New York, NY',
    jobUrl: 'https://example.com/job1',
    description: 'We are looking for a Senior Software Engineer to join our team...',
    salary: '$120,000 - $150,000',
    jobType: 'Full-time',
    platform: 'LinkedIn',
    postedDate: new Date()
  },
  {
    title: 'Frontend Developer',
    company: 'Tech Company B',
    location: 'San Francisco, CA',
    jobUrl: 'https://example.com/job2',
    description: 'Join our team as a Frontend Developer and work on exciting projects...',
    salary: '$100,000 - $130,000',
    jobType: 'Full-time',
    platform: 'Indeed',
    postedDate: new Date()
  }
];

// 獲取所有職位
router.get('/', async (req, res) => {
  try {
    // 先检查数据库中是否有数据
    const existingJobs = await Job.find();
    
    // 如果没有数据，插入测试数据
    if (existingJobs.length === 0) {
      await Job.insertMany(testJobs);
      console.log('已插入测试数据');
    }
    
    // 返回所有职位
    const jobs = await Job.find().sort({ postedDate: -1 });
    res.json(jobs);
    console.log('成功Get');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 創建新職位
router.post('/', async (req, res) => {
  try {
    console.log('成功Post');
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
    console.log('成功Post/batch');
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