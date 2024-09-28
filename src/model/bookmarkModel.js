const mongoose = require('mongoose');
const bookmarkSchema=new mongoose.Schema({
    bookmarkID:{
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
module.exports = mongoose.model('Bookmark', bookmarkSchema);
