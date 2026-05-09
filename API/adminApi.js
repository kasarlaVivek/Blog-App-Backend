import exp from "express"
import { userTypeModel } from "../Models/userModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";

export const adminApp = exp.Router();

// read all articles(optional)
// block users
adminApp.put("/user-block/:userId",async(req,res)=> {
    let uid = req.params.userId;
    let userDoc = await userTypeModel.findById(uid);
    if(!userDoc || !userDoc.isActive){
        return res.status(401).json({message:"user not found"});
    }
    let modifiedUserDoc = await userTypeModel.findByIdAndUpdate(uid,{
        $set:{isActive:false}
    },{new:true,runValidators:true});
    res.status(201).json({message:"user blocked successfully",modifiedUserDoc});
})
//  unblock articles
adminApp.put("/user-unblock/:userId",async(req,res)=> {
    let uid = req.params.userId;
    let userDoc = await userTypeModel.findById(uid);
    if(!userDoc){
        return res.status(401).json({message:"user not found"});
    }
    if(userDoc.isActive){
        return res.status(401).json({message:"user is already unblocked"});
    }
    let modifiedUserDoc = await userTypeModel.findByIdAndUpdate(uid,{
        $set:{isActive:true}
    },{new:true,runValidators:true});
    res.status(201).json({message:"user unblocked successfully",modifiedUserDoc});
})
