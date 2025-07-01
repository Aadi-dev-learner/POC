const express = require("express");
const axios = require("axios");
const router = express.Router();
const { LeetCode, Credential } = require("leetcode-query");
const createResponse = require("../../models/SubmissionResponseModel");
const ErrorHandler = require("../../models/ErrorClass");
async function createGraphReq(query, variables, next) {
    try {
        const axiosResponse = await axios.post("https://leetcode.com/graphql", { query, variables });
        console.log(axiosResponse.data);
        return axiosResponse.data;
    }
    catch (err) {
        return next(new ErrorHandler(err, 500));
    }
}



async function authMW(req, res, next) {
    if (req.body.sessionToken) {
        try {

            const credential = new Credential();
            await credential.init(req.body.sessionToken);
            req.leetcode = new LeetCode(credential);
            next();
        }
        catch (err) {
            return next(new ErrorHandler("Invalid session token", 401));
        }
    }
    else {


        return next(new ErrorHandler("Please provide the session token", 400));
    }
}



router.get("/", (req, res) => {
    res.send("this is the lc api");
})
router.post("/question-count", async (req, res, next) => {
    console.log(req.body);
    try {

        let variables = {
            "username": req.body.username
        };
        const query = `#graphql
        query userProblemsSolved($username: String!) {
            allQuestionsCount {
                difficulty
                count
            }
            matchedUser(username: $username) {
                problemsSolvedBeatsStats {
                difficulty
                percentage
                }
                submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
                }
            }
        }`
        const axiosResponse = await createGraphReq(query, variables, next);
        console.log(axiosResponse);
        let submissionNum = axiosResponse.data.matchedUser.submitStatsGlobal.acSubmissionNum;
        console.log(submissionNum);
        res.status(200).json({
            total: submissionNum[0]?.count,
            easy: submissionNum[1]?.count,
            medium: submissionNum[2]?.count,
            hard: submissionNum[3]?.count
        });
        // res.send(axiosResponse);

    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler("Server error occured", 500));
    }


})

router.post("/submissions", authMW, async (req, res, next) => {
    try {
        let questionDetails = {};
        let pages = req.query.pages || 0;
        let promiseArray = [];
        let offset = 0;
        while (pages >= 0) {
            promiseArray.push((req.leetcode.submissions({ limit: 40, offset: offset })));
            offset += 40;
            pages--;

        }
        let responseArray = (await Promise.all(promiseArray)).flat();
        console.log(responseArray);
        let finalResponse = createResponse("leetcode");
        for (i in responseArray) {
            let element = responseArray[i];
            finalResponse = {
                id: element.id,
                platform: "leetcode",
                language: element.lang,
                time: element.time,
                title: element.titleSlug,
                status: element.statusDisplay
            }
            responseArray[i] = finalResponse;

        }

        // {
        //     id: "",
        //     platform: platform,
        //     language: "",
        //     time: "",
        //     title: "",
        //     status: "",
        //     ...(platform == "leetcode" && { difficulty: "" }),
        //     ...(platform == "codeforces" && { rating: "" }),
        // }

        console.log(responseArray.length);

        res.status(200).json(responseArray);
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler("Server error occurred", 500));
    }
})
router.post("/accepted-submissions", authMW, async (req, res, next) => {
    try {
        let limit = req.query.limit || 40;
        const data = (await req.leetcode.user_progress_questions({ limit: limit }));
        res.status(200).json(data);
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler("Server Error Occured", 500));
    }
})
router.post("/submission-detail", authMW, async (req, res, next) => {
    try {

        const data = await req.leetcode.submission(req.body.id);
        res.status(200).json(data);
    }
    catch (err) {
        return next(new ErrorHandler("Server error occurred", 500));
    }
})


module.exports = router;