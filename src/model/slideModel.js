const mongoose=require('mongoose')
const slideSchema=new mongoose.Schema(
    {
      slideID:{
        type:String,
        required: true,
        unique:true

      },
      storyID:{
        type:String,
        required: true
      },
      heading:{
        type:String,
        
      },
      description:{
        type:String,
        
      },
      imageOrVideoURl:{
        type:String,
       

      },
      category:{
        type:String,
        
      }

    }
)
module.exports = mongoose.model('Slide',slideSchema)