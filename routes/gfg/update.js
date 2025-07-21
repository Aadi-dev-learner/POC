const express = require('express')
const axios = require('axios')

const router = express.Router()

const update = require('../../middlewares/updateData')
const authenticate = require('../../middlewares/authentication')
const credentials = require('../../middlewares/gfgCredentials')

router.post('/update', authenticate, credentials, update, async (req, res) => {
    res.json({ message: 'Update completed via middleware' });
})

module.exports = router