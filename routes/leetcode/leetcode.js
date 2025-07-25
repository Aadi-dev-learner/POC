const express = require("express");
const axios = require("axios");
const router = express.Router();
const { LeetCode, Credential } = require("leetcode-query");
const createResponse = require("../../models/SubmissionResponseModel");
const ErrorHandler = require("../../models/ErrorClass");
const userModel = require("../../models/User");
const authenticate = require("../../middlewares/authentication");
const autoUpdater = {
    interval: 10,
    last_updated: 1751394600000
}

async function createGraphReq(query, variables, next) {
    try {
        const axiosResponse = await axios.post("https://leetcode.com/graphql", { query, variables });
        console.log(axiosResponse.data);
        return axiosResponse.data;
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler(err.message, 500));
    }
}




//function responsible for authenticating sessiontoken for leetcode and returning the leetcode object
async function createLeetcode(sessionToken) {
    if (!sessionToken) {
        throw new ErrorHandler("Session token is required", 400);
    }

    try {
        const credential = new Credential();
        await credential.init(sessionToken);

        return new LeetCode(credential);
    } catch (err) {
        console.log(err);
        throw new ErrorHandler("Invalid session token", 401);
    }
}

async function wrongCount(leetcode, titleSlug) {
    try {

        const query = {
            query: `#graphql
                        query submissionList($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String!, $lang: Int, $status: Int) {
                            questionSubmissionList(
                                offset: $offset
                                limit: $limit
                                lastKey: $lastKey
                                questionSlug: $questionSlug
                                lang: $lang
                                status: $status
                            ) {
                                lastKey
                                hasNext
                                submissions {
                                id
                                title
                                titleSlug
                                status
                                statusDisplay
                                lang
                                langName
                                runtime
                                timestamp
                                url
                                isPending
                                memory
                                hasNotes
                                notes
                                flagType
                                frontendId
                                topicTags {
                                    id
                                }
                                }
                            }
                            }`,
            variables: {
                offset: 0,
                limit: 40,
                lastKey: null,
                questionSlug: titleSlug,
                lang: null,
                status: null
            }
        };

        const problemSubmissions = await leetcode.graphql(query);
        let count = 0;
        for (let i = problemSubmissions.data.questionSubmissionList.submissions.length - 1; i >= 0; i--) {
            const submission = problemSubmissions.data.questionSubmissionList.submissions[i];
            if (submission.statusDisplay !== 'Accepted') {
                count++;
            }
            else {
                if (submission.timestamp * 1000 < autoUpdater.last_updated) return -1;
                else break;
            }
        }
        return count;
    }
    catch (err) {
        console.log(err);
        throw new ErrorHandler("Server error occurred", 500);
    }
}

async function getProblemDetails(leetcode, titleSlug) {

    try {
        console.log(titleSlug);
        const problemDetails = await leetcode.problem(titleSlug);
        return {
            title: problemDetails.title,
            difficulty: problemDetails.difficulty,
            titleSlug: problemDetails.titleSlug,
            questionId: problemDetails.questionId,
        }
    } catch (err) {
        console.log(err);
        throw new ErrorHandler("Failed to fetch problem details", 500);
    }
}
//function responsible for getting the recent submissions for a user
async function getSubmissions(timestamp, sessionToken, limit, offset,prevData) {
    try {
        // TODO: Make it respect the interval
        const leetcode = await createLeetcode(sessionToken);
        const responseArray = (await leetcode.user_progress_questions({limit:limit,skip:offset})).questions;
        console.log(responseArray);
        let finalResponse = createResponse("leetcode");
        let duplicates = {};
        let validElements = [];
        for (i in responseArray) {
            let element = responseArray[i];
            console.log(element);
            const date = new Date(element.lastSubmittedAt);
            element.timestamp = date.getTime();
            if (element.timestamp < timestamp) {
                console.log(element.timestamp,timestamp);
                console.log("broke");
                reachedLimit = true;
                break;
            }
            if (duplicates[element.titleSlug]) {
                continue;
            }
            if (prevData[element.title]) {
                continue;
            }
            let problemDetails = await getProblemDetails(leetcode, element.titleSlug);
            let count = await wrongCount(leetcode, element.titleSlug);
            if (count === -1) {
                continue;
            }
            finalResponse = {
                title: element.title,
                platform: "leetcode",
                timestamp: element.timestamp,
                wrong_count: count,
                difficulty: problemDetails.difficulty,
            }

            responseArray[i] = finalResponse;
            duplicates[element.titleSlug] = finalResponse;
            validElements.push(responseArray[i]);
        }
        console.log(validElements);
        return validElements;
    } catch (err) {
        console.log(err)
        throw new ErrorHandler("Server error occurred", 500);
    }
}


router.get("/", (req, res) => {
    res.send("this is the lc api");
})


//function responsible for getting the question count for a user
router.get("/question-count", authenticate, async (req, res, next) => {
    console.log(req.body);
    try {
        console.log(req.user);
        let variables = {
            "username": req.user.leetcodeId
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
        let submissionNum = axiosResponse.data.matchedUser.submitStatsGlobal?.acSubmissionNum;
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


//a common route calling the getSubmissions function
router.post("/recents", authenticate, async (req, res, next) => {
    try {
        const prevData = req.body.prevData;
        const limit = req.query['limit'];
        const offset = req.query['offset'];
        const sessionToken = req.user.leetcodeSessionToken;
        const prevMap = {};
        prevData?.forEach(item => {
            prevMap[item?.title] = 1;
        })
        const response = await getSubmissions(autoUpdater.last_updated, sessionToken,limit,offset,prevMap);
        res.status(200).json(response);
    }
    catch (err) {
        console.log(err);
        throw new ErrorHandler(err.message, err.status || 500);
    }
})

router.post("/update-details", authenticate, async (req, res, next) => {
    try {
        const username = req.user.username;
        await userModel.updateOne({ username }, {
            leetcodeSessionToken: req.body.leetcodeSessionToken || req.user.leetcodeSessionToken,
            leetcodeId: req.body.leetcodeId || req.user.leetcodeId,
        });
        res.send("Details updated");
    }
    catch (err) {
        next(new ErrorHandler("A server error occured", 500));
    }
})

module.exports = router;









