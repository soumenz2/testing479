const UserModel=require('../model/userModel');
const bcrypt=require('bcryptjs')
const jwt = require('jsonwebtoken');
const { randomUUID } =require('crypto');
const mongoose = require('mongoose');

const { validationResult }=require('express-validator');
const config = require('../config');

const signup=async(req,res)=>{
    try{
        const error=validationResult(req)
        if(!error.isEmpty()){
           return res.status(400).send({msg:error.array()})
        } 
        console.log("entered try block")
        const {username,password }=req.body;
       
        const existingUser=await UserModel.findOne({username})
        if(existingUser){
           return res.status(401).json({
            success:false,
            message:"User Allready Exist"
        })
        }else{
            console.log('Received data:', {username,password });
            const salt=bcrypt.genSaltSync(10);
            const hashpassword=bcrypt.hashSync(password,salt)
            const newUser=new UserModel({
                userID: randomUUID(),
                username:username,
                password:hashpassword

    
            })
            await newUser.save()
            return res.status(200).json({
                success:true,
                message:"Registration Done Successfully",
                data:res.data
            });
            
        }

    
    } 
    catch(error){
        console.log("sign up Issue")
        if (!res.headersSent) {  // Check if headers have been sent
            return res.status(500).json({
                success: false,
                message: "Server Error"
            });
        } else {
            console.error("Headers already sent. Cannot send additional response.");
        }
    }

}
const login=async(req,res)=>{
    try{
        const {username,password}=req.body;
        console.log("entered try block")
        const existingData= await UserModel.findOne({username})
        console.log(existingData)
        if(existingData){
            const passwordMatch= await bcrypt.compare(password,existingData.password)
            if(!passwordMatch){
                res.status(401).send({msg:"Password is wrong"})
            }
            const token=jwt.sign({_id:existingData.userID},config.secret,{ expiresIn: '1h' })
            res.status(200).send({
                msg:"Login Sucessfully",
                token
            })

        }
        else{
            res.status(404).send({msg:"Yoor Account is not Registered "})
        }

    }
    catch(error){
        res.status(501).send({msg:error.message})

    }

}
module.exports ={
    signup,
    login

}