import {Tweet} from '../models/tweet.model.js';
import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import {ResponceApi} from '../utils/responceApi.js'
import mongoose from 'mongoose';
const createTweet = asyncHandler(async (req,res)=>{
     const {content} = req.body;
     if(!content){
        throw new ApiError(400,"Content is required to createTweet");
     }
     const tweet = await  Tweet.create({
        content:content,
        owner: req.user._id
     })
     const isTweetCreated = await Tweet.findById(tweet?._id);
     if(!isTweetCreated){
        throw new  ApiError(400,"Some issue occured while creating tweet");
     }
     res.status(200)
        .json( new ResponceApi(200,isTweetCreated,"tweet created successfully"))

})
const getUserTweet = asyncHandler(async (req,res)=>{
     const tweets = await Tweet.find({owner:req.user?._id}).select("content createdAt updatedAt");
     console.log(tweets);
    if(!tweets){
        throw new ApiError(400,"tweet were not fetched");
    }
    res.status(200)
       .json( new ResponceApi(200,tweets,"Tweet were fetched successfully"));
})
const updateTweet = asyncHandler(async (req,res)=>{
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!tweetId){
        throw new ApiError(400,"tweetId is invalid");
    }
    if(!content){
        throw new ApiError(400,"Content is required to update tweet");
    }
    const tweetToUpdate = await Tweet.findByIdAndUpdate(tweetId,{
        content
    },{new:true});

    if(!tweetToUpdate){
        throw new ApiError(400,"tweet is not updated")
    }
    res.status(200)
       .json(new ResponceApi(200,tweetToUpdate,"tweet is updated successfully"))   
})

const deleteTweet = asyncHandler(async (req,res)=>{
    const {tweetId}=  req.params;
    
    if(!tweetId){
        throw new ApiError(400,"tweet id is not valid ");
    }
    const deleteTweet = await Tweet.findByIdAndDelete(tweetId,{$unset:{content:1,owner:1}},{new:true});
    if(!deleteTweet){
        throw new ApiError(400,"Some error occured while deleting tweet");
    }
    res.status(200)
       .json(new ResponceApi(200,"User deleted successfully"));
})

export {createTweet,getUserTweet,updateTweet,deleteTweet}