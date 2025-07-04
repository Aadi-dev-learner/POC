const express = require("express");
const axios = require("axios");
const router = express.Router();
const { LeetCode, Credential } = require("leetcode-query");
const createResponse = require("../../models/SubmissionResponseModel");
const ErrorHandler = require("../../models/ErrorClass");
const userModel = require("../../models/User");

const autoUpdater = {
  interval: 10,
  last_updated: 1751394600000
}

async function createGraphReq(query, variables, next) {
    try {
        const axiosResponse = await axios.get("https://leetcode.com/graphql", { query, variables });
        console.log(axiosResponse.data);
        return axiosResponse.data;
    }
    catch (err) {
        return next(new ErrorHandler(err, 500));
    }
}




//function responsible for authenticating sessiontoken for leetcode and returning the leetcode object
async function authenticate(sessionToken) {
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




//function responsible for getting the recent submissions for a user
async function getSubmissions(timestamp, sessionToken) {
    try {
        // TODO: Make it respect the interval
        const leetcode = await authenticate(sessionToken);

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

                finalResponse = {
                    id: element.id,
                    platform: "leetcode",
                    language: element.lang,
                    time: element.time,
                    title: element.titleSlug,
                    status: element.statusDisplay,
                    timeStamp : element.timestamp
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
router.get("/question-count", async (req, res, next) => {
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


//a common route calling the getSubmissions function
router.get("/submissions", async (req, res, next) => {
    try {

        const username = req.body.username;
        const userInfo = await userModel.findOne({ username: username });
        
        const sessionToken = userInfo.leetcodeSessionToken;
        
        const response = await getSubmissions(autoUpdater.last_updated, sessionToken);
        res.status(200).json(response);
    }
    catch(err) {
        console.log(err);
        throw new ErrorHandler(err.message , err.status || 500);
    }
})

// router.get("/accepted-submissions", authMW, async (req, res, next) => {
//     try {
//         let limit = req.query.limit || 40;
//         const data = (await req.leetcode.user_progress_questions({ limit: limit }));
//         res.status(200).json(data);
//     }
//     catch (err) {
//         console.log(err);
//         return next(new ErrorHandler("Server Error Occured", 500));
//     }
// })

module.exports = router;









// async function getRawSubmissions(req,res,next) {
//     try {
//         const submissions = await req.leetcode.submissions({limit : 40,offset : 0});
//         req.submissions = submissions;
//         next();
//     }
//     catch(err) {
        
//         return next(new ErrorHandler("Server Error Ocurred",500));
//     }
// }



// router.get("/submission-detail", authMW, async (req, res, next) => {
//     try {

//         const data = await req.leetcode.submission(req.body.id);
//         res.status(200).json(data);
//     }
//     catch (err) {
//         return next(new ErrorHandler("Server error occurred", 500));
//     }
// })

// router.get("/recent-submissions",authMW,getRawSubmissions,async (req,res,next) => {
//     let submissions = req.submissions;
//     const timeStamp = req.query['interval'] * 60000;
//     const currentTime = Date.now();
//     let offset = 0;
//     let response = [];
//     for (let i = 0;i < submissions.length;i++) {
//         if((currentTime- timeStamp) <= submissions[i].timestamp) {
//             response.push(submissions[i]);
//         } 
//         else {
//             break;
//         }

//         // TODO: Remove magic number
//         if (i == submissions.length-1) {
//             offset+=40; // 40 is the limit of submissions per request
//             const nextResponse = await req.leetcode.submissions({limit : 40,offset : offset});
//             console.log(nextResponse)
//             submissions = [...submissions,...nextResponse]
//         }
//     }
//     const diffeculty = {};
    

//     for (i in response) {
//         if (!diffeculty[response[i].titleSlug]) {
//             const problemInfo = await req.leetcode.problem(response[i].titleSlug);
//             console.log(problemInfo);
//             diffeculty[response[i].titleSlug] = problemInfo;
//         }
//     }
//     res.status(200).json(response);
// })

