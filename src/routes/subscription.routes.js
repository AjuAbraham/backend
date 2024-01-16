import { Router } from "express";
import {verifyJwt} from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const subscriptionRoutes = Router();


subscriptionRoutes.use(verifyJwt)

subscriptionRoutes.route('/channel-subscriber/:channelId').get(getUserChannelSubscribers)   
subscriptionRoutes.route('/subscribed-channels/:subscriberId').get(getSubscribedChannels)
subscriptionRoutes.route('/toggle-subscription/:channelId').post(toggleSubscription)
export default subscriptionRoutes;