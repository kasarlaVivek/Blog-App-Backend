import exp from "express";
import {register,authentication} from "../Services/authService.js"
import { userTypeModel } from "../Models/userModel.js";
import bcrypt ,{ compare,hash } from "bcryptjs";
import { verifyToken } from "../middlewares/verifyToken.js";
import { articleModel } from "../Models/articleModel.js";

export const commonApp = exp.Router();

// get all active articles (public)
commonApp.get("/articles", async (req, res) => {
    try {
        let articlesData = await articleModel.find({ isArticleActive: true })
            .populate("author", "firstName lastName profileImageUrl email")
            .sort({ createdAt: -1 }); // Latest first
        res.status(200).json({ message: "articles retrieved", payload: articlesData });
    } catch (err) {
        res.status(500).json({ message: "error occurred", error: err.message });
    }
});


// login
commonApp.post("/login",async(req,res)=>{
    // get user credentials obj
    let userCred = req.body;
    // call authenticate service
    let { token, user } = await authentication(userCred);
    // save token as httpOnly
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true
        })
    // send res
    res.status(201).json({ message: "user login success" , payload:user})
})


// refresh page(protected)
commonApp.get("/check-auth",verifyToken("USER","AUTHOR","ADMIN"),async(req,res)=>{
    let userObj = await userTypeModel.findById(req.user.userId);
    res.status(200).json({message:"authenticated",payload:userObj});
})


// logout
commonApp.get("/logout",async(req,res)=> {
    res.clearCookie("token",{
        httpOnly:true,
        secure:true,
        sameSite:"none"
    });
    res.status(200).json({message:"logout successful"});
})


// password update
commonApp.put("/user-password/:userId",async(req,res)=> {
    let uid = req.params.userId;
    let {oldPassword,newPassword} = req.body;
    let userDoc = await userTypeModel.findById(uid);
    if(!userDoc || !userDoc.isActive){
        return res.status(403).json({message:"user not found"});
    }
    let userAuth = await bcrypt.compare(oldPassword,userDoc.password);
    if(userAuth == false){
        return res.status(401).json({message:"password is wrong"})
    }
    
    
    let newPass = await bcrypt.hash(newPassword,10);
    let modifiedUser = await userTypeModel.findByIdAndUpdate(uid,{
        $set:{password:newPass}
    },{
        new:true,
        runValidators:true
    })
    res.status(201).json({message:"password updated successfully"})
})