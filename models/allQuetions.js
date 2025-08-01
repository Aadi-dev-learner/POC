const mongoose = require('mongoose')

const allQuetions = new mongoose.Schema({ 
    user : String,
    title : String,
    platform : String,
    wrongCnt : Number,
    timestamp : Number,
    difficulty : String,
})

module.exports = mongoose.model("allQuetions", allQuetions)
