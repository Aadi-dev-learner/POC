const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username : {
        type:String,
        required:true
    },
    password : {
        type:String,
        required:true
    },
    email : {
        type:String,
        required:true
    },
    leetcodeSessionToken:{
        type:String,
    },
    leetcodeId : {
        type:String,
    },
    codeforcesId : {
        type:String,
    },
    gfgId : {
        type:String,
    }
});

const userModel = mongoose.model('User',userSchema);

module.exports = userModel;