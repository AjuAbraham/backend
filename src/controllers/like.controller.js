import { isValidObjectId } from 'mongoose';
import {Like} from '../models/like.model.js';
import {ApiError} from '../utils/apiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ResponceApi} from '../utils/responceApi.js';


const toggleVideoLike = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    const isLiked = await Like.findOne({video:videoId, likedBy:req.user?._id});
    if(!isLiked){
        const createLike = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        const checkIfLiked = await Like.findById(createLike?._id);
        if(!checkIfLiked){
            throw new ApiError(400,"Error while liking video")
        }
        res.status(200).json(new ResponceApi(200,checkIfLiked,"liked successfully"))
    }
    else{
        const unlikeVideo = await Like.findByIdAndUpdate(isLiked,{
            $unset:{video:1,likedBy:1}
        },{new:true})
        if(!unlikeVideo){
            throw new ApiError(400,"Unable to unlike video")
        }
        res.status(200).json( new ResponceApi(200,"Unliked successfully"));
    }
})

const toggleCommentLike = asyncHandler(async (req,res)=>{
    const {commentId} = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid Comment ID");
    }
    const comment = await Like.findOne({comment:commentId,likedBy:req.user?._id});
    if(!comment){
        const likeComment = await Like.create({
            comment:commentId,
            likedBy:req.user?._id
        })
        const checkLikedComment = await Like.findById(likeComment?._id);
        console.log("Liked comment: ",checkLikedComment);
        if(!checkLikedComment){
            throw new ApiError(400,"unable to like the comment");
        }
        res.status(200).json(new ResponceApi(200,"Message liked successfully"));
    }
    else{
        const removeLike = await Like.findByIdAndDelete(comment?._id);
        console.log("unlike comment: ",removeLike);
        if(!removeLike){
            throw new ApiError(400,"Error occured while unliking comment");
        }
        res.status(200).json(new ResponceApi(200,"Comment unliked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweet Id");
    }
    const tweet = await Like.findOne({tweet:tweetId,owner:req.user?._id});
    if(!tweet){
        const likeTweet = await Like.create({
            tweet:tweetId,
            owner:req.user?._id,
        })
        const checkLike = await Like.findById(likeTweet?._id);
        console.log("like tweet:",checkLike);
        if(!checkLike){
            throw new ApiError(400,"unable to like the tweet");
        }
        res.status(200).json(new ResponceApi(200,"tweet liked successfully"));
    }
    else{
        const unlikeTweet = await Like.findByIdAndDelete(tweet?._id);
        console.log("unlike tweet is:",unlikeTweet);
        if(!unlikeTweet){
            throw new ApiError(400,"Error occured while unliking tweet");
        }
        res.status(200).json(new ResponceApi(200,"tweet unliked successfully"));
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const likedVideos = await Like.find({likedBy: userId})
})

export {toggleVideoLike,toggleCommentLike,toggleTweetLike}