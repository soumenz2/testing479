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
    getStorybyId
}=require('../controller/storyController.js')

const {body}=require('express-validator')
const authRouter=Router();
authRouter.post('/signup',validateUser,signup);
authRouter.post('/login',login);
authRouter.post('/createStoryWithSlide',createStoryWithSlide);
authRouter.get('/getStoryByCategory',getStoryByCategory);
authRouter.get('/getStorybyId',getStorybyId);

module.exports=authRouter
