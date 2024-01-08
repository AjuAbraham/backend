import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import   Jwt  from "jsonwebtoken";

   export const verifyJwt  = asyncHandler(async(req,_,next)=>{
    try {
        const token =req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!token){
            throw new ApiError(400,"Unauthorized access")
        }     
        const decodedToken = Jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if(!user){
            throw new ApiError(401,"Invalid access token");
        }
        req.user=user;
        next()
    } catch (error) {
        throw new ApiError(400,"unauthorized access");
    }
   })