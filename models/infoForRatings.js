const mongoose = require('mongoose')

const requiredInfo = new mongoose.Schema({
    pname : String,
    difficulty : String,
    wrongCnt : Number,
})

module.exports = mongoose.models("infoForRatings", requiredInfo)
