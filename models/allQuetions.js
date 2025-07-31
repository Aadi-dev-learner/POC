const mongoose = require('mongoose')

const allQuetions = new mongoose.Schema({ 
    user : String,
    title : {type : String, unique : true},
    platform : String,
    wrongCnt : Number,
    timestamp : Number,
    difficulty : String,
})

module.exports = mongoose.model("allQuetions", allQuetions)
