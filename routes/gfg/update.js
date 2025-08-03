const express = require('express')
const axios = require('axios')
const auth = require('../../middlewares/authentication')
const cred = require('../../middlewares/gfgCredentials')

const router = express.Router()

const update = require('../../middlewares/updateData')

router.post('/update', auth, cred, update, async (req, res) => {
    res.json({ message: 'Update completed via middleware' });
})

module.exports = router