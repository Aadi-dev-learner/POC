const mongoose = require("mongoose")

const recents = new mongoose.Schema({
    user : String,
    title : String,
    platform : String,
    wrongCnt : Number,
    timestamp : Number,
    difficulty : String,
})

module.exports = mongoose.model("recents", recents)