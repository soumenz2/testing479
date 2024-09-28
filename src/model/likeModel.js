const mongoose = require('mongoose');
const likeSchema=new mongoose.Schema({
    likeID:{
        type:String,
    required: true,
    unique: true
    },
    userID:{
        type:String,
        required: true

    },
    slideID:{
        type:String,
        required: true,

      },
 

   

})
module.exports = mongoose.model('Like', likeSchema);
