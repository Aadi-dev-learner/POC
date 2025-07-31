const axios = require('axios')
const allQues = require('../models/allQuetions')
const recentQues = require('../models/recents')

const updateQues = async (req, res, next) => {
    try {
        const { data } = await axios.post('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', req.body || {}, {
            headers: {
                'Content-Type': 'application/json', 
                'Cookie' : req.headers.cookie || '',
        }})

        const result = data?.result || {}
        const ques = []

        for (const difficulty of Object.keys(result)) {

            if (difficulty === 'School' || difficulty === 'Basic') continue

            for (const qid of Object.keys(result[difficulty])) {
                const q = result[difficulty][qid]

                const problem = q.slug
                const problemData = (await axios.get(`https://practiceapi.geeksforgeeks.org/api/latest/problems/${problem}/submissions/user/`, {
                    headers: {
                        'Content-Type': 'application/json', 
                        'Cookie' : req.headers.cookie || '',
                }}))

                const submissions = problemData.data.results?.submissions || []

                let wrongCount = 0
                let time = ""

                for (let i = submissions.length - 1; i >= 0; i--) {
                    if (submissions[i].user_score == 0) {
                        wrongCount += 1
                    } else {
                        time += submissions[i].subtime
                        break
                    }
                }

                let timestamp = time.replace(' ', 'T')

                ques.push({
                    user : req.body.handle,
                    title : q.slug,
                    platform : 'gfg',
                    wrongCnt : wrongCount,
                    timestamp : new Date(timestamp).getTime(),
                    difficulty
                })
            }
        }

        await recentQues.deleteMany({ user : req.body.handle })
        
        const newQues = []

        for (const q of ques) {
            const exist = await allQues.exists({ title : q.title, user : req.body.handle })
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