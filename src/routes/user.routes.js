import { Router } from "express";
import { registerUser,
    loginUser,
    logOutUser, 
    refreshAcessToken, 
    changePassword, 
    currentUser, 
    updateAccountDetial,
    updateUserAvatar,
    updateUserCoverImage, 
    getUserChannelProfile, 
        getUserWatchHistroy } from "../controllers/user.controller.js";
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
userRoutes.route('/refresh-token').post(refreshAcessToken)
userRoutes.route('/change-password').post(verifyJwt,changePassword)
userRoutes.route('/current-user').get(verifyJwt,currentUser)
userRoutes.route('/update-account-detail').patch(verifyJwt,updateAccountDetial)
userRoutes.route('/update-avatar').patch(verifyJwt,upload.single('avatar'),updateUserAvatar)
userRoutes.route('/update-coverImage').patch(verifyJwt,upload.single('coverImage'),updateUserCoverImage)
userRoutes.route('/c/:username').get(verifyJwt,getUserChannelProfile)
userRoutes.route('/history').get(verifyJwt,getUserWatchHistroy)
export default userRoutes;