import { Router } from "express";
import {verifyJwt} from '../middlewares/auth.middleware.js'
import { toggleVideoLike } from "../controllers/like.controller.js";

const likeRoutes = Router();
likeRoutes.use(verifyJwt)
likeRoutes.route('/toggle-videolike/:videoId').post(toggleVideoLike);