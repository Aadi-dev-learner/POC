const express = require('express');
const router = express.Router();
const recents = require('../../models/recents');
const update = require('../../middlewares/updateData')

router.get('/recent', update, async (req, res) => {
    try {
        const recent = await recents.find({});
        res.json(recent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch recent questions' });
    }
});

module.exports = router;
