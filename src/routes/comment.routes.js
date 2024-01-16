import { Router } from "express";

import {verifyJwt} from '../middlewares/auth.middleware.js';
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const commentRoutes = Router();
commentRoutes.use(verifyJwt);

commentRoutes.route('/:videoId').get(getVideoComments).post(addComment);
commentRoutes.route('/c/:commentId').patch(updateComment).delete(deleteComment);


export default commentRoutes