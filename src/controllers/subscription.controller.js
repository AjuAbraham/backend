import { Subscription } from "../models/subscription.model.js";
import {ApiError} from '../utils/apiError.js'
import {ResponceApi} from '../utils/responceApi.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";


const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId}= req.params;
    const userId = req.user._id;
    if(!channelId){
        throw new ApiError(400,"Error in finding channel");
    }
    const exsistedChannel = await User.findById(channelId);
    if(!exsistedChannel){
        throw new ApiError(400,"channel dos'nt exsist");
    }
    const document = await User.findOne({channel:channelId,subscriber:userId})
    if(!document){
        const newSub =  await Subscription.create({
            subscriber: userId,
            channel: channelId
         })
        const check = await Subscription.findById(newSub?._id);
        if(!check){
            throw new ApiError(400,"Unable to subscribe");
        }
        res.status(200).json( new ResponceApi(200,{subscribed:true},"Subscribed successfully"));
    }
    else{
    const result = await Subscription.findByIdAndUpdate(document._id,{$unset:{subscriber:1,channel:1}},{new:true});
    res.status(200).json(new ResponceApi(200,{subscribed:false,result},"unsubbed successfully"))
    }
})


const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
    const {channelId}=  req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Error occured while finding channel");
    }
    const subscribers = await Subscription.aggregate([
        {
        $match: {
            channel: new mongoose.Types.ObjectId(channelId)
        }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
            pipeline:[
                {
                    $project:{
                        username:1,
                        avatar:1,
                    }
                }
            ]
        }
        },
        {
            $addFields:{
                subscriber:{
                    $first: "$subscriber"
                }
            }
        }
    ])
    if(!subscribers.length){
        throw new ApiError(400,"Some issue occured while fetchcing channel's subscribers");
    }
    if(subscribers.length==0){
        res.status(200).json( new ResponceApi(200,"channel have zero subscriber"));
    }
    res.status(200)
       .json( new ResponceApi(200,subscribers,"subscriber fetched successfully"))
})

const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const {subscriberId} = req.params;
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"invalid subscriber Id");
    }
    const channels = await Subscription.aggregate([
        {
            $match:{
                  subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                channel:{
                    $first: "$channel"
                }
            }
        }
    ])
    if(!channels.length){
        throw new ApiError(400,"unable to fetch subscribed channels of user");
    }
    if(channels.length==0){
        throw new ApiError(400,"user have no subscribers");
    }
    res.status(200).json(new ResponceApi(200,channels,"channel retrieved successfully"));
})


export {getUserChannelSubscribers, getSubscribedChannels,toggleSubscription}