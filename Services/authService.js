import jwt from "jsonwebtoken";
import bcrypt, { hash } from "bcryptjs";
import {userTypeModel} from "../Models/userModel.js";
import { config } from "dotenv";
config()

// register function
export const register = async(userObj) => {
    // create document
    const userDoc = new userTypeModel(userObj);
    // validate for empty password
    await userDoc.validate();
    // hash and replace plain password
    userDoc.password = await bcrypt.hash(userDoc.password,10);
    // save the user doc 
    const created = await userDoc.save();
    // convert document to object to remove password
    const newUserObj =  created.toObject();
    // remove password
    delete newUserObj.password;
    // return user obj without password
    return newUserObj
}

// authentication functioin
export const authentication = async({email,password}) => {
    // check user with email and role
    const user = await userTypeModel.findOne({email});
    if(!user){
        const err = new Error("Invalid user email");
        err.status = 401;
        throw err;
    }
    // if user valid but blocked by the admin
    if(!user.isActive){
        const err = new Error("user is blocked, please contact admin");
        err.status = 403;
        throw err;
    }

    // compare passwords
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        const err = new Error("Invalid password");
        err.status = 401;
        throw err;
    }

    const token = await jwt.sign(
        {
            userId:user._id,
            email:user.email,
            role:user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn:"1h"
        }
    );
    // convert doc to js object
    const userObj = user.toObject();
    // delete the password from the obj
    delete userObj.password;
    return {token , user : userObj}; 
}