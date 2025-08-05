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

router.get("/", (req, res) => {
    res.send("This is the codeforces api");
});


function ratingToDifficulty(rating) {
    if (rating <= 1000) {
        return "easy";
    } else if (rating <= 1400) {
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
    const allDataResponse = await axios.get(
      `${url}/user.status?handle=${cfHandle}`
    );
    const allData = allDataResponse.data.result;

    let responseArray = [];
    let solvedQuesMap = new Map(); // key: uniqueId -> [wrong_count, is_solved_flag]
    const timestamp = autoUpdater.last_updated;

    // Step 1: Identify accepted problems after last_updated
    for (let i = 0; i < allData.length; i++) {
      const submission = allData[i];
      const problem = submission.problem;
      const ProblemName = problem.name;
      const uniqueId = `${problem.contestId}-${problem.index}-${ProblemName}`;

      if (
        submission.verdict === "OK" &&
        submission.creationTimeSeconds > timestamp &&
        !solvedQuesMap.has(uniqueId)
      ) {
        solvedQuesMap.set(uniqueId, [0, 0]); // [wrong_count, is_solved_flag]

        responseArray.push({
          title: ProblemName,
          name: uniqueId,
          platform: "codeforces",
          difficulty: ratingToDifficulty(problem.rating),
          wrong_count: 0,
          timestamp: submission.creationTimeSeconds * 1000,
        });
      }
    }

    // Step 2: Backtrack to calculate wrong submissions and handle early ACs
    for (let i = allData.length - 1; i >= 0; i--) {
      const submission = allData[i];
      const problem = submission.problem;
      const uniqueId = `${problem.contestId}-${problem.index}-${problem.name}`;

      if (solvedQuesMap.has(uniqueId)) {
        const [wrongCount, isSolved] = solvedQuesMap.get(uniqueId);

        if (!isSolved) {
          if (submission.verdict !== "OK") {
            solvedQuesMap.set(uniqueId, [wrongCount + 1, isSolved]);
          } else {
            if (submission.creationTimeSeconds < timestamp) {
              solvedQuesMap.delete(uniqueId);
              responseArray = responseArray.filter(
                (entry) => entry.name !== uniqueId
              );
            } else {
              solvedQuesMap.set(uniqueId, [wrongCount, 1]);
            }
          }
        }
      }
    }

    // Step 3: Update wrong counts in responseArray
    for (let i = 0; i < responseArray.length; i++) {
      const entry = responseArray[i];
      const key = entry.name;
      entry.wrong_count = solvedQuesMap.get(key)?.[0] || 0;
    }

    res.status(200).json(responseArray);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ "error in cf recents": err.message });
  }
});

router.post("/updates-details",authenticate,async(req,res,next) => {
    try {
        const username = req.user.username;
        const codeforcesId = req.body.codeforcesId || req.user.codeforcesId;
        
        const userFound = await userModel.updateOne({username : username}, {
            codeforcesId : codeforcesId
        });
        res.send("Details updated");
    }
    catch(err) {
        next(new ErrorHandler("Server error occured",500));
    }

})

router.get("/question-count", authenticate, async (req, res) => {
  try {
    const cfHandle = req.user.codeforcesId;
    const { data } = await axios.get(`${url}/user.status?handle=${cfHandle}`);
    const allData = data.result;

    let solvedQues = new Set();
    let easy = 0,
      mid = 0,
      hard = 0;

    for (let submission of allData) {
      if (submission.verdict === "OK") {
        const problem = submission.problem;

        const uniqueId = `${problem.contestId}-${problem.index}-${problem.name}`;

        if (!solvedQues.has(uniqueId)) {
          solvedQues.add(uniqueId);

          if (problem.rating) {
            let diff = ratingToDifficulty(problem.rating);
            if (diff === "easy") easy++;
            else if (diff === "medium") mid++;
            else hard++;
          }
        }
      }
    }

    res.status(200).json({
      total: solvedQues.size,
      easy,
      medium: mid,
      hard,
    });
  } catch (err) {
    res.status(500).json({ "error in question-count for cf": err.message });
  }
});



module.exports = router;