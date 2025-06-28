const axios = require('axios')
const allQues = require('../models/allQuetions')
const recentQues = require('../models/recents')

const updateQues = async (req, res) => {
    try {
        const { data } = await axios.post('https://api.example.com/getQuestions', req.body || {})

        const result = data?.result || {}

        const ques = []

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

        await recentQues.deleteMany({})
        
        const newQues = []

        for (const q of ques) {
            const exist = await allQues.exists({quetionid : q.quetionid})
            if (!exist) {
                newQues.push(q)
            }
        }

        if (newQues.length > 0) {
            await allQues.insertMany(newQues)
            await recentQues.insertMany(newQues)
        }

        res.json({added : newQues.length})

        next()

    } catch (err) {
        console.error('[Update Error]:', err.message)
        next()
    }
}

module.exports = updateQues