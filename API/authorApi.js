import exp from "express";
import { register, authentication } from "../Services/authService.js";
import { userTypeModel } from "../Models/userModel.js";
import { articleModel } from "../Models/articleModel.js";
import { checkAuthor } from "../middlewares/checkAuthor.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";
import { upload } from "../config/multer.js";
import cloudinary from "../config/cloudinary.js";


export const authorApp = exp.Router();

// register author(public)
authorApp.post("/users", upload.single("profileImgUrl"),
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
        role: "AUTHOR",
        profileImageUrl: cloudinaryResult?.secure_url,
      });
      res.status(201).json({
        message: "User created",
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

// create article(protected)
authorApp.post("/create-articles", verifyToken("AUTHOR"), async (req, res) => {
    // get article from req
    let article = req.body;
    article.author=req.user.userId;
    // create the article doc
    let articleDoc = new articleModel(article);
    // save the doc
    let createdDoc = await articleDoc.save();
    // send res
    res.status(201).json({ message: "article successfully created", payload: createdDoc })
})

// read article of author(protected)
authorApp.get("/articles", verifyToken("AUTHOR"), async (req, res) => {
    // get author id
    let authorId = req.user.userId;
    // retreive articles of author which are active
    let articles = await articleModel.find({ author: authorId}).populate("author", "firstName email profileImageUrl");
    // send res
    res.status(201).json({ message: "articles retrived", payload: articles })
})

// read article by id(protected)
authorApp.get("/articles/:articleId", verifyToken("AUTHOR"), async (req, res) => {
    let articleId = req.params.articleId;
    let articleDoc = await articleModel.findById(articleId).populate("author", "firstName email profileImageUrl");
    if (!articleDoc) {
        return res.status(404).json({ message: "article not found" });
    }
    res.status(201).json({ message: "article found", payload: articleDoc });
})

// edit article(protected)
authorApp.put("/articles/:articleId", verifyToken("AUTHOR"), async (req, res) => {
    let {  title, category, content } = req.body;
    let articleId = req.params.articleId
    let articleDoc = await articleModel.findOne({ _id: articleId, author: req.user.userId });
    if (!articleDoc) {
        return res.status(401).json({ message: "article not available" })
    }
    let updatedArticle = await articleModel.findByIdAndUpdate(articleId,
        { $set: { title: title, category: category, content: content } },
        { new: true });
    res.status(201).json({ message: "article updated", payload: updatedArticle });
})

// delete article(soft-delete)(protected)
authorApp.patch("/articles/:id/status", verifyToken("AUTHOR"), async (req, res) => {
  const { id } = req.params;
  const { isArticleActive } = req.body;
  // Find article
  const article = await articleModel.findById(id).populate("author", "firstName email profileImageUrl");
  console.log(article);
  if (!article) {
    return res.status(404).json({ message: "Article not found" });
  }

  //console.log(req.user.userId,article.author.toString())
  // AUTHOR can only modify their own articles
  if (req.user.role === "AUTHOR" && article.author.toString() !== req.user.userId) {
    return res.status(403).json({ message: "Forbidden. You can only modify your own articles" });
  }
  // Already in requested state
  if (article.isArticleActive === isArticleActive) {
    return res.status(400).json({
      message: `Article is already ${isArticleActive ? "active" : "deleted"}`,
    });
  }

  //update status
  article.isArticleActive = isArticleActive;
  await article.save();

  //send res
  res.status(200).json({
    message: `Article ${isArticleActive ? "restored" : "deleted"} successfully`,
    payload: article, // ✅ use payload instead of article
  });
});