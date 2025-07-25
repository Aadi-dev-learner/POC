const mongoose = require('mongoose')

const allQuetions = new mongoose.Schema({ 
    title : {type : String, unique : true},
    platform : String,
    wrongCnt : Number,
    timestamp : Number,
    difficulty : String,
})

module.exports = mongoose.model("allQuetions", allQuetions)
