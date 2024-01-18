import { Router } from "express";
import {verifyJwt} from '../middlewares/auth.middleware.js'
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const likeRoutes = Router();
likeRoutes.use(verifyJwt)
likeRoutes.route('/toggle-videolike/:videoId').post(toggleVideoLike);
likeRoutes.route('/toggle-commentlike/:commentId').post(toggleCommentLike);
likeRoutes.route('/toggle-tweetlike/:tweetId').post(toggleTweetLike);
likeRoutes.route('/get-likedVideos').get(getLikedVideos)


export default likeRoutes;