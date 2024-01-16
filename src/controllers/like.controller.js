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
    }
})


export {toggleVideoLike}