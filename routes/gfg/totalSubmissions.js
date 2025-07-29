const express = require("express")
// const userDB = require('../../models/User')
const router = express.Router()
const allQuetions = require('../../models/allQuetions')
const authenticate = require("../../middlewares/authentication")

router.get('/question-count', authenticate, credentials, async (req, res) => {
    let easy = 0
    let mid = 0
    let hard = 0
    let total = 0

    try {
        const all = await allQuetions.find({})
        for (que in all) {
            if (all[que].difficulty === "Easy") {
                easy++
            }
            else if (all[que].difficulty === "Medium") {
                mid++
            }
            else if (all[que].difficulty === "Hard"){
                hard++
            }
        }

        total = easy + mid + hard

        res.json({
            'total' : total,
            'easy' : easy,
            'medium' : mid, 
            'hard' : hard,
        })
    } catch(err) {
        console.error('[Que Count Error]:', err.message)
        res.status(500).json({
            error : 'failed to fetch all questions'
        })
    }

    
})

module.exports = router