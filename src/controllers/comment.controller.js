import {Comment}  from '../models/comment.model.js'
import mongoose, { isValidObjectId } from 'mongoose'
import {ApiError} from "../utils/ApiError.js"
import {ResponceApi} from "../utils/responceApi.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from '../models/like.model.js'

const getVideoComments =  asyncHandler(async (req,res)=>{
    const {videoId}= req.params;
    const {page = 1, limit=10 } = req.query;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id");
    }
    const option = {
        page: parseInt(page,10),
        limmit:  parseInt(limit,10)
    }
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            }
        },
        {
             $lookup:{
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            email:1,
                            avatar:1,
                        }
                    },
                   
                ]
             },
        },
        {
            
                $addFields:{
                    owner: {$first: "$owner"}
                }
            
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes",
            },
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                isLiked:{
                    $cond:{
                        if: {$in:[req.user?._id,"$likes.likedBy"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                content:1,
                createdAt:1,
                updatedAt:1,
                owner:1,
                isLiked:1,
                likesCount:1
            }
        }
    ]);
 
    if(!comments){
        throw new ApiError("Failed to fetch comment");
    }
    const result = await Comment.aggregatePaginate(comments,option);
    if(!result){
        throw new ApiError(400,"Error while creating aggregate pages")
    }
    res.status(200).json(new ResponceApi(200,comments,"Comment fetched successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId}= req.params;
    const {content} = req.body;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }
    if(!content){
        throw new ApiError(400,"Content is required to add comment");
    }
    const createComment =  await Comment.create({
        content,
        video:videoId,
        owner:req.user?._id
    })
    const check = await Comment.findById(createComment);
    if(!check){
        throw new ApiError(400,"Some error occure while creating comment");
    }
    res.status(200).json(new ResponceApi(200,check,"comment added successfully"));
})

const updateComment = asyncHandler(async (req,res)=>{
    const {commentId} = req.params;
    const {content} = req.body;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment ID");
    }
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(400,"No such comment exsist");
    }
    if(!content){
        throw new ApiError(400,"Content is required to update comment");
    }
    const newComment = await Comment.findByIdAndUpdate(commentId,{$set:{content}},{new:true});
    if(!newComment){
        throw new ApiError(400,"Error while updating comment")
    }
    res.status(200).json(new ResponceApi (200,newComment,"comment updated successfully"))
})

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id");
    }
    const commentDelete = await Comment.deleteOne({_id:commentId});
    if(!commentDelete){
        throw new ApiError(400,"Unable to delete comment");
    }
    const commentLikesToDelete = await Like.deleteMany({comment: commentId});
    if(!commentLikesToDelete){
        throw new ApiError(400,"error occured while removing likes of the comment");
    }
    
    res.status(200).json(new ResponceApi(200,"comment deleted successfully"))
})

export {getVideoComments,addComment,updateComment,deleteComment}