const express = require("express");
const axios = require("axios");
const router = express.Router();
const ErrorHandler = require("../../models/ErrorClass");
const url = "https://codeforces.com/api";
const createResponse = require("../../models/SubmissionResponseModel");


const autoUpdater =  { 
    interval : 10,
    last_updated: 1751585332000
};

router.get("/", (req, res) => {
    res.send("This is the codeforces api");
})



router.get("/user-info", (req, res, next) => {
    axios(`${url}/user.info?handles=${req.query['handle']}`).then(data => {
        res.status(200).json(data.data);
    }).catch(err => {
        return next(new ErrorHandler("Server error occured", 500));
    })
})



async function getSubmissions(timestamp) {
    try {
        const out = [];
        const submissions = (await axios(`${url}/user.status?handle=${req.query['handle']}`)).data;
        req.submissions = submissions.result;
        submissions.every(submissionElement => {
            if (submissionElement.creationTimeSeconds < timestamp) {
                return false;
            }
            out.push(submissionElement);
        })
    }
    catch (err) {
        return next(new ErrorHandler("Server error occured", 500));
    }

}

router.get("/submissions", async (req, res, next) => {
    const username = req.body.username;
    
       
})
router.get("/question-count", async (req, res, next) => {
    try {

        const ratings = { unrated: new Set() };
        let count = 0;

        const submissions = (await axios(`${url}/user.status?handle=${req.query['handle']}`)).data.result;

        for (i in submissions) {

            if (!submissions[i].problem.rating) {
                if (submissions[i].verdict == 'OK') {
                    count += 1;
                    ratings['unrated']?.add(submissions[i].problem.name)
                }
            }
            else {
                if (submissions[i].verdict == 'OK') {
                    if (!ratings[submissions[i].problem.rating]) ratings[submissions[i].problem.rating] = new Set();
                    count += 1;
                    ratings[submissions[i].problem.rating].add(submissions[i].problem.name)
                }
            }
        }
        console.log(count);
        let finalResponse = { total: 0 };

        for (i in ratings) {
            finalResponse[i] = ratings[i].size;
            finalResponse.total += ratings[i].size;
        }

        res.status(200).json(finalResponse);
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler("Server error occured", 500));
    }
})
router.get("/recent-submissions",getSubmissions, (req, res, next) => {
    const interval = req.query['interval'] * 60000;
    const currentTime = Date.now();
    const response = [];
    for (i in req.submissions) {
        const d = new Date(req.submissions[i].creationTimeSeconds);

        if ((currentTime - interval) <= d.getMilliseconds()) {
            response.push(req.submissions[i]);
        }
        else {
            break;
        }
    }
    res.status(200).json(response);
})


module.exports = router;