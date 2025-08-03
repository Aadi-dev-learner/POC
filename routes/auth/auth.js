const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const userModel = require("../../models/User");;
const ErrorHandler = require("../../models/ErrorClass");
const jwt = require("jsonwebtoken");

require("dotenv").config();


router.get("/check-auth", async (req, res, next) => {
    console.log(req.headers);
    try {

        const token = req.headers.authorization?.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({
            "message": "User authenticated"
        });

    }
    catch {
        return next(new ErrorHandler("Token expired or invalid", 401));
    }

})

router.post("/login", async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log(username);

    try {
        const userFound = await userModel.findOne({ username: username });
        console.log(userFound);
        if (!userFound) {
            
            return next(new ErrorHandler("User not found", 404));
        }
        if (userFound.password != password) {
            return next(new ErrorHandler("Incorrect password", 401));
        }

        let token = jwt.sign({
            userId: username,
        }, process.env.JWT_SECRET, {
            expiresIn: "2h"
        });

        res.status(200).json({
            "username": username,
            "jwt_token": token,
            "leetcodeId": userFound.leetcodeId,
            "gfgId": userFound.gfgId,
            "codeforcesId": userFound.codeforcesId,
            "leetcodeSessionToken": userFound.leetcodeSessionToken,
            "gfgCookie" : userFound.gfgCookie,
        });

    }
    catch (err) {
        return next(new ErrorHandler(err, 500));

    }
})

router.post("/signup", async (req, res, next) => {


    const { username, password, email, leetcodeId, gfgId, codeforcesId, leetcodeSessionToken,gfgToken } = req.body;

    const user = userModel({
        username: username,
        password: password,
        leetcodeSessionToken: leetcodeSessionToken,
        leetcodeId: leetcodeId,
        codeforcesId: codeforcesId,
        gfgId: gfgId,
        gfgCookie : gfgToken,
        email: email
    });

    try {
        const userFound = await userModel.findOne({ username: username });

        if (userFound) {
            return next(new ErrorHandler("User already exists", 402));
        }

        await user.save();

        let token = jwt.sign({
            userId: username,
        }, process.env.JWT_SECRET, {
            expiresIn: "2h"
        })

        res.status(200).json({
            "jwt_token": token,
            "username": username,
            "leetcodeSessionToken": leetcodeSessionToken,
            "leetcodeId": leetcodeId,
            "gfgId": gfgId,
            "codeforcesId": codeforcesId
        });
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler(err, 500));
    }

})




module.exports = router;