const express=require('express')
const Router = express.Router; 
const verifyToken=require('../middleware/token.validation.js')
const validateUser=require('../middleware/user.validation.js')

const {
    signup,
    login
}=require('../controller/authController.js')
const {
    createStoryWithSlide,
    getStoryByCategory,
    getStorybyId,
    setbookmark,
    getbookmarkbyId,
    isLikedslides,
    unlikeSlides,
    likeslides,
    isbookmarked
    
}=require('../controller/storyController.js')

const {body}=require('express-validator')
const authRouter=Router();
authRouter.post('/signup',validateUser,signup);
authRouter.post('/login',login);
authRouter.post('/createStoryWithSlide',createStoryWithSlide);
authRouter.get('/getStoryByCategory',getStoryByCategory);
authRouter.get('/getStorybyId',getStorybyId);
authRouter.post('/setbookmark',setbookmark);
authRouter.post('/setbookmark',setbookmark);

authRouter.get('/getbookmarkbyId',getbookmarkbyId);
authRouter.get('/isbookmarked',isbookmarked);

authRouter.get('/isLikedslides',isLikedslides);
authRouter.post('/likeslides',likeslides);
authRouter.post('/unlikeSlides',unlikeSlides);


module.exports=authRouter
