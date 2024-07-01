import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, _, next) => {

try {
        const token = req.cookies?.accessToken || // if req is coming from browser
        req.header("Authorization")?.replace("Bearer ", "") // when req is coming from mobile it usually comes in header with field Authorization: Bearer <Token> we only want token hence replace "Bearer "
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        // now we will decode the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // only the one with secret token can verify
    
        // now we will find user
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken"); // thats why we give user id to jwt while creating the token in user.model.js
    
        if(!user){
            throw new ApiError(401, "Invalid access token")
        }
    
        req.user = user;
        next();
} catch (error) {
        throw new ApiError(401, error.message || "Invalid access token")
}
})