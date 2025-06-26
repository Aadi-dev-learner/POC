const mongoose = require("mongoose")

const recents = new mongoose.Schema({
    quetionid : {type : String, unique : true}, 
    pname : String, 
    slug : String,
    lang : String,
    difficulty : String,
})

module.exports = mongoose.model("recents", recents)