const express = require('express');
const router = express.Router();
const recents = require('../../models/recents');
const authenticate = require('../../middlewares/authentication')
const credentials = require('../../middlewares/gfgCredentials')

router.get('/recent', authenticate, async (req, res) => {
    try {
        const recent = await recents.find({});
        res.json(recent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch recent questions' });
    }
});

module.exports = router;
