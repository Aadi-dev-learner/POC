const express = require('express')
const axios = require('axios')

const router = express.Router()

const allQuetions = require('../models/allQuetions')
const recents = require('../models/recents')

router.post('/update', async (req, res) => {
    try {
        const { data } = await axios.post('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', req.body)

        const ques = []

        const result = data?.result || {}

        for (const difficulty of Object.keys(result)) {
            for (const qid of Object.keys(result[difficulty])) {
                const q = result[difficulty][qid]

                ques.push({
                    quetionid : qid,
                    pname : q.pname,
                    slug : q.slug,
                    lang : q.lang,
                    difficulty
                })
            }
        }

        await recents.deleteMany({})

        const newQues = []

        for (const q of ques) {
            const exist = await allQuetions.exists({quetionid : q.quetionid})
            if (!exist) {
                newQues.push(q)
            }
        }

        if (newQues.length > 0) {
            await allQuetions.insertMany(newQues)
            await recents.insertMany(newQues)
        }

        res.json({added : newQues.length})

    } catch (err) {
        res.status(500).json(({error: "update failed"}))
    }
})

module.exports = router