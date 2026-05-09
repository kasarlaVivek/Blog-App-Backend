import { userTypeModel } from "../Models/userModel.js"

export const checkAuthor = async (req, res, next) => {
    // get author id(but we're not sure where to get the id as we are about to use this middleware in multiple routes)
    let authorId = req.params?.authorID || req.body.author;
    // verify author
    let author = await userTypeModel.findById(authorId);
    if(!author){
          return res.status(401).json({message:"Invalid author"})
     }
     //if author found and invalid role
     if(author.role!='AUTHOR'){
          return res.status(403).json({message:"User is not an author"})
     }
     //if author is blocked
     if(!author.isActive){
          return res.status(403).json({message:"author account is not active"})
     }

     next();
}