const express = require('express')
const axios = require('axios')

const router = express.Router()

const update = require('../middlewares/updateData')

router.post('/update', update, async (req, res) => {
    res.json({ message: 'Update completed via middleware' });
})

module.exports = router