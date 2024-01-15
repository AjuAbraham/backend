import { Router } from "express";
import {verifyJwt} from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const subscriptionRoutes = Router();


subscriptionRoutes.use(verifyJwt)

subscriptionRoutes.route('/channel-subscriber/:channelId').get(getUserChannelSubscribers)
subscriptionRoutes.route('/subscribed-channels/:channelId').get(getSubscribedChannels)
subscriptionRoutes.route('/toogle-subscription/:channelId').get(toggleSubscription)
export default subscriptionRoutes;