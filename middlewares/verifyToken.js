import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

export const verifyToken = (...allowedRoles) => {
    return async (req, res, next) => {
        // read token from req
        let token = req.cookies.token;
        if (!token) {
            return res.status(400).json({ message: "Unauthorized request , please login" })
        }
        try {
            // verify validity of token(decoding the token
            let decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            // check if role is allowed
            if (!allowedRoles.includes(decodedToken.role)) {
                return res.status(401).json({ message: "Forbidden . You dont have permissioins" })
            }
            // attach user info to req for use in routes
            req.user = decodedToken;
            // forward req to next route or middleware
            next();
        } catch (err) {
            // jwt.verify throws uf tken is invalid/expired
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "session expired.Please login again" })
            }
            if (err.name === "JsonWebTokenError") {
                return res.status(401).json({ message: "invalid token.Please login again" })
            }
            // next(err);
        }
    }
}