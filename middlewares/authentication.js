const jwt = require("jsonwebtoken");
const ErrorHandler = require("../models/ErrorClass");
const userModel = require("../models/User");

async function authenticate(req, res, next) {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return next(new ErrorHandler("No token provided", 401));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findOne({ username: decoded.userId });
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        req.user = user; 
        next();
    } catch (err) {
        console.log(err);
        next(new ErrorHandler("Failed to authenticate user", 500));
    }
}

module.exports = authenticate;