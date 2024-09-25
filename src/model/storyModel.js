const mongoose = require('mongoose');
const storySchema=new mongoose.Schema({
    storyID:{
        type:String,
    required: true,
    unique: true
    },
    userID:{
        type:String,
        required: true

    },
    createdOn:{
        type:Date,
        required:true
    },
    category:{
        type:String,
        required:true
    }
   

})
module.exports = mongoose.model('Story', storySchema);
