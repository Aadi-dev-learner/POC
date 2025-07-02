const express = require('express');
const router = express.Router();
const recents = require('../models/recents');

router.get('/recent', async (req, res) => {
    try {
        const recent = await recents.find({});
        res.json(recent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch recent questions' });
    }
});

module.exports = router;
