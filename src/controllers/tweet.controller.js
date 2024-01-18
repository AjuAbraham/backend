import {Tweet} from '../models/tweet.model.js';
import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import {ResponceApi} from '../utils/responceApi.js'
import mongoose, { isValidObjectId } from 'mongoose';
import {Like} from '../models/like.model.js'

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
    const {userId} =  req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid User id");
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
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
                owner:{
                    $first: "$owner"
                }
            }
        },
        {
            $lookup:{
                from:'likes',
                localField:"_id",
                foreignField:"tweet",
                as:"likes"
            }
        },
        {
            $addFields:{
                likeCount:{
                    $size:"$likes"
                },
                isLiked:{
                    $cond:{
                        if:{$in:[req.user?._id,"$likes.likedBy"]},
                        then:true,
                        else:false
                      }
                }
                
            }
        },
        {
            $project:{
                content:1,
                createdAt:1,
                updatedAt:1,
                likeCount:1,
                isLiked:1,
                owner:1,
            }
        }
    ])
    if(!tweets.length){
        throw new ApiError(400,"Unable to fetch user tweets");
    }
    if(tweets.length==0){
        throw new ApiError(400,"User have zero tweets");
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
       .json(new ResponceApi(200,"tweet is updated successfully"))   
})

const deleteTweet = asyncHandler(async (req,res)=>{
    const {tweetId}=  req.params;
    
    if(!tweetId){
        throw new ApiError(400,"tweet id is not valid ");
    }
    const deleteTweet = await Tweet.deleteOne({_id:tweetId});
    if(!deleteTweet){
        throw new ApiError(400,"Some error occured while deleting tweet");
    }
    const deleteLikes = await Like.deleteMany({tweet:tweetId});
    if(!deleteLikes){
        throw new ApiError(400,"Error while deleting likes of tweet")
    }
    res.status(200)
       .json(new ResponceApi(200,"Tweet deleted successfully"));
})

export {createTweet,getUserTweet,updateTweet,deleteTweet}