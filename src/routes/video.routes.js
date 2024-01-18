import { Router } from "express";
import {verifyJwt} from '../middlewares/auth.middleware.js'
import {upload} from "../middlewares/multer.middleware.js"
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateThumbnail, updateVideoDetial } from "../controllers/video.controller.js";
const videoRoutes = Router();
videoRoutes.use(verifyJwt)
videoRoutes.route('/video-upload').post(upload.fields([
    {
        name:"video",
        maxCount:1, 
    },{
        name:"thumbnail",
        maxCount:1
    }
]),publishAVideo);
videoRoutes.route('/get-video/:videoId').get(getVideoById);
videoRoutes.route('/update-video-detail/:videoId').patch(updateVideoDetial);
videoRoutes.route('/update-thumbnail/:videoId').patch(upload.single('thumbnail'),updateThumbnail);
videoRoutes.route('/delete-video/:videoId').get(deleteVideo);
videoRoutes.route('/toggle-published/:videoId').get(togglePublishStatus);
videoRoutes.route('/getAllVideos/:userId').get(getAllVideos);
export default videoRoutes;