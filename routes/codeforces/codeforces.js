const express = require("express");
const axios = require("axios");
const router = express.Router();
const ErrorHandler = require("../../models/ErrorClass");
const url = "https://codeforces.com/api";
const createResponse = require("../../models/SubmissionResponseModel");
const userModel = require("../../models/User");

const autoUpdater = {
    interval: 10,
    last_updated: 1751585332000
};

router.get("/", (req, res) => {
    res.send("This is the codeforces api");
});



router.get("/user-info", (req, res, next) => {
    axios(`${url}/user.info?handles=${req.query['handle']}`).then(data => {
        res.status(200).json(data.data);
    }).catch(err => {
        return next(new ErrorHandler("Server error occured", 500));
    })
        .catch((err) => {
            return next(new ErrorHandler("Server error occured", 500));
        });
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



async function getSubmissions(handle,timestamp) {
    try {
        const out = [];
        const submissions = (await axios(`${url}/user.status?handle=${handle}`)).data;
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

router.get("/recent-submissions", async (req, res, next) => {
    const username = req.body.username;
    const cfHandle = (await userModel.findOne({username : username})).codeforcesId;

    res.send(cfHandle);
})
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
            while (cnt < 5) {
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
