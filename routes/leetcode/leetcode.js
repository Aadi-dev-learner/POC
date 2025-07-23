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

async function wrongCount(leetcode,titleSlug) {
    try {

        const query = {
            query : `#graphql
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
                console.log("submissions of a problem : ",problemSubmissions);
                let acceptedCount = problemSubmissions.data.questionSubmissionList.submissions.filter(submission => submission.statusDisplay === 'Accepted').length;
                console.log(acceptedCount);
                let count = 0; 
                for (let i = problemSubmissions.data.questionSubmissionList.submissions.length - 1; i >= 0; i--) {
                    const submission = problemSubmissions.data.questionSubmissionList.submissions[i];
                    if (submission.statusDisplay !== 'Accepted') {
                        count++;
                    } else {
                        break; 
                    }
                }  
                return acceptedCount === 1 ? count : -1;
            }
            catch (err) {
                console.log(err);
                throw new ErrorHandler("Server error occurred", 500);
            }
        }

async function getProblemDetails(leetcode, titleSlug) {
    try {
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
async function getSubmissions(timestamp, sessionToken) {
    try {
        // TODO: Make it respect the interval
        const leetcode = await createLeetcode(sessionToken);
        let offset = 0;
        let out = [];
        while (true) {
            const responseArray = await leetcode.submissions({ limit: 40, offset: offset });
            let finalResponse = createResponse("leetcode");

            let reachedLimit = false;
            let validElements = [];
            for (i in responseArray) {
                let element = responseArray[i];
                if (element.timestamp < timestamp) {
                    reachedLimit = true;
                    break;
                }
                if (element.statusDisplay != 'Accepted') {
                    continue; // Skip non-accepted submissions
                }
                let count = await wrongCount(leetcode, element.titleSlug);
                console.log(count);
                if (count === -1) {
                    continue; // Skip if no accepted submissions
                }
                let problemDetails = await getProblemDetails(leetcode, element.titleSlug);
                finalResponse = {
                    title: element.title,
                    platform: "leetcode",
                    timestamp : element.timestamp,
                    wrong_count: count,
                    difficulty: problemDetails.difficulty,
                }
                responseArray[i] = finalResponse;
                validElements.push(responseArray[i]);
            }

            out = [...out, ...validElements];
            if (reachedLimit) {
                break;
            }

            // TODO: Remove magic number
            offset += 40; // 40 is the limit of submissions per request
        }

        return out;
    } catch (err) {
        console.log(err)
        throw new ErrorHandler("Server error occurred", 500);
    }
}


router.get("/", (req, res) => {
    res.send("this is the lc api");
})


//function responsible for getting the question count for a user
router.get("/question-count",authenticate, async (req, res, next) => {
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


//a common route calling the getSubmissions function
router.get("/recents",authenticate, async (req, res, next) => {
    try {

        const sessionToken = req.user.leetcodeSessionToken;
        const response = await getSubmissions(autoUpdater.last_updated, sessionToken);
        res.status(200).json(response);
    }
    catch(err) {
        console.log(err);
        throw new ErrorHandler(err.message , err.status || 500);
    }
})


module.exports = router;









