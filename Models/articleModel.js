import { Schema,model } from "mongoose";

// create user-comment schema
const userCommentSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'user'
    },
    comment:{
        type:String
    }
})

// create article schema
const articleSchema = new Schema({
    author:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:[true,"atuhor id required"]
    },
    title:{
        type:String,
        required:[true,"title required"]
    },
    category:{
        type:String,
        required:[true,"category required"]
    },
    content:{
        type:String,
        required:[true,"content required"]
    },
    comments:{
        type:[userCommentSchema]
    },
    isArticleActive:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true,
    strict:"throw",
    versionKey:false
})

export const articleModel = model("article",articleSchema)