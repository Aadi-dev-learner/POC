const axios = require('axios')
const allQues = require('../models/allQuetions')
const recentQues = require('../models/recents')
const createResponse = require("../models/SubmissionResponseModel");
const updateQues = async (req, res, next) => {
    try {
        const { data } = await axios.post('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', req.body || {})

        const result = data?.result || {}
        const finalResponse = createResponse("gfg");
        const ques = []

        for (const difficulty of Object.keys(result)) {

            if (difficulty === 'School' || difficulty === 'Basic') continue

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

        console.log("updated succesfully.")

        next()

    } catch (err) {
        console.error('[Update Error]:', err.message)
        next()
    }
}

module.exports = updateQues