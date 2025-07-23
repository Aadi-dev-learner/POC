const express = require("express");
const router = express.Router();
const authenticate = require("../../middlewares/authentication");
const userModel = require("../../models/User");
const ErrorHandler = require("../../models/ErrorClass");

router.post("/update-details", authenticate, async (req, res, next) => {
    try {
        const username = req.user.username;
        await userModel.updateOne({ username }, {
            gfgId: req.body.gfgId || req.user.gfgId,
            gfgCookie: req.body.gfgCookie || req.user.gfgCookie
        });
        res.send("Details updated");
    }
    catch (err) {
        next(new ErrorHandler("A server error occured", 500));
    }
})
module.exports = router;