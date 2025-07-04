const express = require("express");
const axios = require("axios");
const router = express.Router();
const ErrorHandler = require("../../models/ErrorClass");
const url = "https://codeforces.com/api";
const createResponse = require("../../models/SubmissionResponseModel");
const userModel = require("../../models/User");

const autoUpdater = {
  interval: 10,
  last_updated: 1744272913,
};

router.get("/", (req, res) => {
  res.send("This is the codeforces api");
});


function ratingToDifficulty(rating) {
  if (rating < 1000) {
    return "easy";
  } else if (rating < 1400) {
    return "medium";
  } else {
    return "hard";
  }
}

async function getSubmissions(handle, timestamp) {
  try {
    const out = [];
    let submissions = (await axios(`${url}/user.status?handle=${handle}`)).data;

    submissions = submissions.result;
    submissions.every((submissionElement) => {
      console.log(submissionElement);
      if (submissionElement.creationTimeSeconds > timestamp) {
        return false;
      }
      out.push(submissionElement);
    });
    console.log(out);
    return out;
  } catch (err) {
    console.log(err);
    return next(new ErrorHandler("Server error occured", 500));
  }
}
router.get("/user-info", (req, res, next) => {
  axios(`${url}/user.info?handles=${req.query["handle"]}`)
    .then((data) => {
      res.status(200).json(data.data);
    })
    .catch((err) => {
      return next(new ErrorHandler("Server error occured", 500));
    })
    .catch((err) => {
      return next(new ErrorHandler("Server error occured", 500));
    });
});

router.get("/recent-submissions", async (req, res, next) => {
  try {
    // const username = req.body.username;
    // const cfHandle = (await userModel.findOne({ username: username }))
    //   .codeforcesId;
    const cfHandle = "Mayank016";
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
          name: ProblemName,
          platform: "codeforces",
          difficulty: ratingToDifficulty(problem.rating),
          wrong_count: 0,
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
                (entry) => entry.name !== ProblemName
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
      const currentQues = responseArray[i];
      const ProblemName = currentQues.name;

      currentQues.wrong_count = solvedQues[ProblemName][0];
    }

    res.status(200).json(responseArray);
  } catch (err) {
    console.log(err);
    return next(new ErrorHandler("Server error occurred", 500));
  }
});

router.get("/submissions", (req, res, next) => {
  axios(`${url}/user.status?handle=${req.query["handle"]}`)
    .then((data) => {
      const responseData = data.data.result;
      console.log(data.data);
      // let finalResponse = createResponse("codeforces");
      // let responseArray = [];
      // for (i in responseData) {
      //     finalResponse = {
      //         id: responseData[i].id,
      //         language: responseData[i].programmingLanguage,
      //         title: responseData[i].problem?.name,
      //         status: responseData[i].verdict,
      //     };
      //     responseArray.push(finalResponse);
      // }
      let responseArray = [];
      let cnt = 0;
      let idx = 0;

      let solvedQues = {};
      while (cnt < 5 && idx < responseData.length) {
        const ProblemName = responseData[idx].problem.name;

        if (responseData[idx].verdict == "OK") {
          solvedQues[ProblemName] = [0, 0]; // count of wrong submissions, found correct

          let finalResponse = {
            name: ProblemName,
            platform: "codeforces",
            difficulty: ratingToDifficulty(responseData[idx].problem.rating),
            wrong_count: 0,
            timestamp: responseData[idx].creationTimeSeconds, //Integer. Time, when submission was created, in unix-format.
          };

          responseArray.push(finalResponse);
          cnt++;
        }

        idx++;
      }

      for (let i = responseData.length - 1; i >= 0; i--) {
        //traversing from last
        const ProblemName = responseData[i].problem.name;

        if (solvedQues[ProblemName]) {
          if (solvedQues[ProblemName][1] == 0) {
            if (responseData[i].verdict != "OK") {
              //if not solved yet
              solvedQues[ProblemName][0]++; // increase submissions count
            } else {
              solvedQues[ProblemName][1] = 1; // mark as solved;
            }
          }
        }
      }

      for (let i = 0; i < responseArray.length; i++) {
        let currentQues = responseArray[i];
        const ProblemName = currentQues.name;

        currentQues.wrong_count = solvedQues[ProblemName][0];
      }

      res.status(200).json(responseArray);
    })
    .catch((err) => {
      console.log(err);
      return next(new ErrorHandler("Server error occured", 500));
    });
});
router.get("/question-count", async (req, res, next) => {
  try {
    const ratings = { unrated: new Set() };
    let count = 0;

    const submissions = (
      await axios(`${url}/user.status?handle=${req.query["handle"]}`)
    ).data.result;

    for (i in submissions) {
      if (!submissions[i].problem.rating) {
        if (submissions[i].verdict == "OK") {
          count += 1;
          ratings["unrated"]?.add(submissions[i].problem.name);
        }
      } else {
        if (submissions[i].verdict == "OK") {
          if (!ratings[submissions[i].problem.rating])
            ratings[submissions[i].problem.rating] = new Set();
          count += 1;
          ratings[submissions[i].problem.rating].add(
            submissions[i].problem.name
          );
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
  } catch (err) {
    console.log(err);
    return next(new ErrorHandler("Server error occured", 500));
  }
});

module.exports = router;
