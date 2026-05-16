import exp from "express";
import { register, authentication } from "../Services/authService.js";
import { verifyToken } from "../middlewares/verifyToken.js"
import { articleModel } from "../Models/articleModel.js"
import { userTypeModel } from "../Models/userModel.js";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";
import { upload } from "../config/multer.js";
import cloudinary from "../config/cloudinary.js";

export const userApp = exp.Router();


// Register user(public)
userApp.post("/users", upload.single("profileImgUrl"),
  async (req, res, next) => {
    let cloudinaryResult;
    try {
      let userObj = req.body;
      //  Step 1: upload image to cloudinary from memoryStorage (if exists)
      if (req.file) {
        cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      }
      // Step 2: call existing register()
      const newUserObj = await register({
        ...userObj,
        role: "USER",
        profileImageUrl: cloudinaryResult?.secure_url,
      });
      res.status(201).json({
        message: "user created",
        payload: newUserObj,
      });
    } catch (err) {
      // Step 3: rollback 
      if (cloudinaryResult?.public_id) {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id);
      }
      next(err); // send to your error middleware
    }
  }
);

// read article by id
userApp.get('/articles/:articleId', async (req, res) => {
  let articleId = req.params.articleId;
  let articleDoc = await articleModel.findOne({ _id: articleId, isArticleActive: true }).populate("author", "firstName email profileImageUrl");
  if (!articleDoc) {
    return res.status(404).json({ message: "article not found" });
  }
  return res.status(201).json({ message: "article  found", payload: articleDoc });
})


// read all articles(protected)
userApp.get("/articles", verifyToken("USER"), async (req, res) => {
  let articlesData = await articleModel.find({ isArticleActive: true }).populate("author", "firstName lastName profileImageUrl email").populate("comments.user", "firstName email");
  if (!articlesData) {
    return res.status(401).json({ message: "articles not found" });
  }
  res.status(201).json({ message: "articles retreived success", payload: articlesData })
})

// add comment to article(protected)
// add comment to article (protected)
userApp.put("/article/:articleId", verifyToken("USER"), async (req, res) => {
  const { articleId } = req.params;
  const { comment } = req.body;
  // check article
  const articleObj = await articleModel.findById(articleId);
  if (!articleObj || !articleObj.isArticleActive) {
    return res.status(404).json({ message: "Article not found" });
  }
  // check user
  const userObj = await userTypeModel.findById(req.user.userId);
  if (!userObj) {
    return res.status(404).json({ message: "User not found" });
  }
  const newComment = {
    user: userObj._id,
    comment: comment,
  };
  const modifiedArticle = await articleModel.findByIdAndUpdate(
    articleId,
    { $push: { comments: newComment } },
    { new: true, runValidators: true }
  ).populate("comments.user","firstName email profileImageUrl").populate("author", "firstName email profileImageUrl");
  res.status(201).json({ message: "Comment added successfully", payload: modifiedArticle });
}
);
