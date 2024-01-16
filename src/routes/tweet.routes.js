import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweet, updateTweet } from "../controllers/tweet.controller.js";


const tweetRouter = Router();
tweetRouter.use(verifyJwt);

tweetRouter.route('/create-tweet').post(createTweet);
tweetRouter.route('/get-tweet/:userId').get(getUserTweet);
tweetRouter.route('/update-tweet/:tweetId').patch(updateTweet);
tweetRouter.route('/delete-tweet/:tweetId').delete(deleteTweet);
export default tweetRouter;