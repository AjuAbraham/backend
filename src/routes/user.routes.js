import { Router } from "express";
import { registerUser,loginUser,logOutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const userRoutes = Router();

userRoutes.route('/register').post(
     upload.fields([
        {
            name:"avatar",
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1,
        }
     ])
    ,registerUser)
userRoutes.route('/login').post(loginUser)

// secure route
userRoutes.route('/logout').post(verifyJwt,logOutUser)  
export default userRoutes;