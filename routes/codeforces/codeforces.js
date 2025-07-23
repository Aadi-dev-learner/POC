const express = require("express");
const axios = require("axios");
const router = express.Router();
const ErrorHandler = require("../../models/ErrorClass");
const url = "https://codeforces.com/api";

const authenticate = require("../../middlewares/authentication");
const userModel = require("../../models/User");

const autoUpdater = {
    interval: 10,
    last_updated: 1744272913,
};

function ratingToDifficulty(rating) {
    if (rating < 1000) {
        return "easy";
    } else if (rating < 1400) {
        return "medium";
    } else {
        return "hard";
    }
}

router.get("/user-info", authenticate, (req, res, next) => {
    axios(`${url}/user.info?handles=${req.user.codeforcesId}`)
        .then((data) => {
            res.status(200).json(data.data);
        })
        .catch((err) => {
            return next(new ErrorHandler(err.message, 500));
        })
});

router.get("/recents", authenticate, async (req, res, next) => {
    try {
        const cfHandle = req.user.codeforcesId;
        // Fetch all submissions once
        const allDataResponse = await axios(
            `${url}/user.status?handle=${cfHandle}`
        );
        const allData = allDataResponse.data.result;

        let responseArray = [];
        let solvedQues = {};
        const timestamp = autoUpdater.last_updated;

        // Step 1: Identify unique accepted problems after `last_updated`
        for (let i = 0; i < allData.length; i++) {
            const submission = allData[i];
            const problem = submission.problem;
            const ProblemName = problem.name;

            if (
                submission.verdict === `OK` &&
                submission.creationTimeSeconds > timestamp &&
                !solvedQues[ProblemName]
            ) {
                solvedQues[ProblemName] = [0, 0]; // [wrong_count, is_solved_flag]

                const finalResponse = {
                    title: ProblemName,
                    platform: "codeforces",
                    difficulty: ratingToDifficulty(problem.rating),
                    wrongCnt: 0,
                    timestamp: submission.creationTimeSeconds,
                };

                responseArray.push(finalResponse);
            }
        }

        // Step 2: Traverse all submissions to compute wrong counts
        for (let i = allData.length - 1; i >= 0; i--) {
            const submission = allData[i];
            const ProblemName = submission.problem.name;

            if (solvedQues[ProblemName]) {
                if (solvedQues[ProblemName][1] === 0) {
                    if (submission.verdict !== "OK") {
                        solvedQues[ProblemName][0]++;
                    } else {
                        // Check if first correct submission is BEFORE timestamp
                        if (submission.creationTimeSeconds < timestamp) {
                            // Remove from solvedQues
                            delete solvedQues[ProblemName];
                            // Also remove from responseArray
                            responseArray = responseArray.filter(
                                (entry) => entry?.name !== ProblemName
                            );
                        } else {
                            solvedQues[ProblemName][1] = 1;
                        }
                    }
                }
            }
        }

        // Step 3: Update the wrong_count in response
        for (let i = 0; i < responseArray.length; i++) {
            let currentQues = responseArray[i];
            const ProblemName = currentQues.pname;

            currentQues.wrongCnt = solvedQues[ProblemName]?.[0];
        }

        res.status(200).json(responseArray);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ "error in cf recents": err.message })
    }
});

router.get("/question-count", authenticate, async (req, res) => {
    try {
        const cfHandle = req.user.codeforcesId;
        const allDataResponse = await axios(
            `${url}/user.status?handle=${cfHandle}`
        );
        const allData = allDataResponse.data.result;

        let responseArray = [];
        let solvedQues = {};

        let easy = 0
        let mid = 0
        let hard = 0

        for (let i = 0; i < allData.length; i++) {
            const submission = allData[i];
            const problem = submission.problem;
            const ProblemName = problem.name;

            if (
                submission.verdict === `OK` &&
                !solvedQues[ProblemName]
            ) {
                solvedQues[ProblemName]++;

                let diff = ratingToDifficulty(problem.rating)

                if (diff === 'easy') easy++
                else if (diff === 'medium') mid++
                else hard++
            }
        }

        res.status(200).json({
            "Total Ques": (easy + mid + hard),
            "Easy": easy,
            "Medium": mid,
            "Hard": hard
        })
    } catch (err) {
        console.log(err.message)
        res.status(500).json({ "error in pcount for cf": err.message })
    }
})
router.post("/update-details", authenticate, async (req, res, next) => {
    try {
        const username = req.user.username;
        await userModel.updateOne({ username }, {
            codeforcesId: req.body.codeforcesId || req.user.codeforcesId,
        });
        res.send("Details updated");
    }
    catch (err) {
        next(new ErrorHandler("A server error occured", 500));
    }
});

module.exports = router;
