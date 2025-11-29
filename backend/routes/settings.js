const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const logger = require('../utils/logger');

// Get all settings
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    const settings = await Setting.find(query);
    res.json(settings);
  } catch (error) {
    logger.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get setting by key
router.get('/:key', auth, async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    logger.error('Setting fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update or create setting (admin only)
router.put('/:key', auth, adminOnly, async (req, res) => {
  try {
    const { value, category, description } = req.body;
    
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      {
        key: req.params.key,
        value,
        category,
        description,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    logger.info(`Setting ${req.params.key} updated by ${req.user.username}`);
    res.json(setting);
  } catch (error) {
    logger.error('Setting update error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Delete setting (admin only)
router.delete('/:key', auth, adminOnly, async (req, res) => {
  try {
    const setting = await Setting.findOneAndDelete({ key: req.params.key });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    logger.info(`Setting ${req.params.key} deleted by ${req.user.username}`);
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    logger.error('Setting delete error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

module.exports = router;
