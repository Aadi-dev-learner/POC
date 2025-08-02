const express = require("express")
const router = express.Router()
const authenticate = require("../../middlewares/authentication")
const credentials = require("../../middlewares/gfgCredentials");
router.get('/question-count', authenticate, credentials, async (req, res) => {
    let easy = 0
    let mid = 0
    let hard = 0

    try {
        const { data } = await axios.post('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', req.body || {}, {
            headers: {
                'Content-Type': 'application/json', 
                'Cookie' : req.headers.cookie || '',
        }})

        const result = data?.result || {}

        easy += result['Easy'].length
        mid += result['Medium'].length
        hard += result['Hard'].length

        res.json({ "total" : easy + mid + hard, "easy" : easy, "medium" : mid, "hard" : hard });

    } catch (err) {
        console.error('[Update Error]:', err.message)
        res.status(500).json({ error: 'Failed to fetch total questions' });
    }

    
})

module.exports = router