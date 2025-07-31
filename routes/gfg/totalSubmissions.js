const express = require("express")
// const userDB = require('../../models/User')
const router = express.Router()
const allQuetions = require('../../models/allQuetions')
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

        for (const difficulty of Object.keys(result)) {

            if (difficulty === 'School' || difficulty === 'Basic') continue
                
            if (difficulty === 'Easy') easy += result[difficulty].length
            else if (difficulty === 'Medium') mid += result[difficulty].length
            else if (difficulty === 'Hard') hard += result[difficulty].length
            
        }

        res.json({ "Total" : easy + mid + hard, "Easy" : easy, "Medium" : mid, "Hard" : hard });

    } catch (err) {
        console.error('[Update Error]:', err.message)
        res.status(500).json({ error: 'Failed to fetch total questions' });
    }

    
})

module.exports = router