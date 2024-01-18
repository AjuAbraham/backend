import {asyncHandler} from '../utils/asyncHandler.js';
import { Video } from '../models/video.model.js';
import {ApiError} from '../utils/apiError.js';
import {deleteFile, uploadOnCloudinary} from '../utils/cloudinary.js'
import { ResponceApi } from '../utils/responceApi.js'
import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from '../models/like.model.js';

const getAllVideos = asyncHandler(async (req,res)=>{
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user ID");
    }
    if(!query || !sortBy || ! sortType){
        throw new ApiError(404,"All fields are required");
    }
    const option = {
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    };
    const sortOptions = {
        [sortBy]: sortType=== 'desc' ? -1 :1,
    }
    const video = await Video.aggregate([
        {
           $match:{
            $and : [{owner: new mongoose.Types.ObjectId(userId)},{title:{$regex:query,$options:"i"}}]
           }
        },
        {
            $sort: sortOptions,
        }
    ])
    if(!video){
        throw new ApiError(400,"Unable to fetch video");
    }
    const result = await Video.aggregatePaginate(video,option);
    if(result.totalDocs==0){
        res.status(200).json(new ResponceApi(200,"user have no videos"))
    }
    res.status(200).json(200,result,"Video fetche successfully");
})

const publishAVideo =  asyncHandler(async (req,res)=>{
    const {title,description} = await req.body
    if(!(title && description)){
        throw new ApiError(400,"title or description is required");
    }
    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if(!videoLocalPath){
        throw new ApiError(400,"Video is not uploaded on local machine");
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail is not uploaded to local machine");
    }

    const newVideo = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!newVideo){
        throw new ApiError(400,"video not uploaded on cloudinary");
    }
    if(!thumbnail){
        throw new ApiError(400,"thumbnail not uploaded on cloudinary");
    }


    const video = await Video.create({
        videoFile: newVideo?.url,
        thumbnail: thumbnail?.url,
        title: title,
        description: description,
        duration: newVideo.duration,
        owner: req.user._id,
        isPublished: true,
    })
    const createdVideo = await Video.findById(video?._id);
    if(!createdVideo){
        throw new ApiError(400,"Some error while uploading video");
    } 

    res.status(200)
       .json(
        new ResponceApi(200,createdVideo,"video uploaded successfully")
       )
    
})

const getVideoById  = asyncHandler(async(req,res)=>{
       const {videoId} = req.params;
       if(!videoId){
        throw new ApiError(400,"unable to fetch video Id")
       }
       const video = await Video.aggregate([
          {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
          },
          {
            //owner lookup
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"videoOwner",
                //fetching required data by project in sub pipeline
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
            //adding videoOwner field as object rather than array of object 
            $addFields:{
                videoOwner:{
                    $first:"$videoOwner"
                }
            }
          },
          {
             //lookup for likes
             $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes",
             }
          },
          { //adding likeCount field
            $addFields:{
                likeCount:{
                    $size: "$likes"
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
            //lookup for comments of video
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comment",
                pipeline:[  //populating owner field with comment's owner detail
                    {
                       $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"commentOwner",
                        pipeline:[
                            {
                                $project:{
                                    username:1,fullname:1,avatar:1
                                }
                            }
                        ]
                       }
                    },
                    { // adding comment Owner
                        $addFields:{
                            commentOwner:{
                                $first: "$commentOwner"
                            }
                        }
                    }
                ]
            }
          },
          {
            $project:{
                videoFile:1,
                likeCount:1,
                isLiked:1,
                comment:1,
                thumbnail:1,
                videoOwner:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                isPublished:1,
                createdAt:1,
            }
          }
       ])
       if(!video.length){
            throw new ApiError(404,"no such video exsist");
           }
         console.log(video);
       res.status(200)
          .json( new ResponceApi(200,video,"video fetched successfully"));
})

const updateVideoDetial = asyncHandler(async (req,res)=>{
    const {title,description} = req.body;
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400,"unable to fetch video to update it");
    }
    if(!(title || description)){
        throw new ApiError(400,"title && description is required to update the detials");
    }
    const video = await Video.findByIdAndUpdate(videoId,{
        $set: {title,description}
     } , {  new:true })
    if(!video){
        throw new ApiError(400,"unable to update video title & description");
    }
    res.status(200)
       .json(
        new ResponceApi(200,video,"title and description updated successfully")
       )
})

const updateThumbnail = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400,"unable to fetch video to update it");
    }
    // remove prev thumbnail
    const videoFile = await Video.findById(videoId);
    if(!videoFile){
        throw new ApiError(400,"Unable to fetch video to update thumbnail")
    }
    const deleteResult = await deleteFile(videoFile.thumbnail);
    if(!deleteResult){
        throw new ApiError(400,"Not able to delete prev thumbnail")
    }


    const thumbnailLocalPath = req.file.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required to update");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(400,"Error  while uploading file on cloudinary");
    }
    
    const video = await Video.findByIdAndUpdate(videoId,{
        $set:{thumbnail:thumbnail.url}
    },{new:true})

    if(!video){
        throw new ApiError(400,"Some error occured while updating thumbnail");
    }
    res.status(200)
       .json(new ResponceApi(200,video,"Thumbnail updated successfully"));
})

const deleteVideo = asyncHandler(async (req,res)=>{
     const {videoId} = req.params;

     const videoToDelete = await Video.findById(videoId);

     const cloudinaryVideoDelete = await deleteFile(videoToDelete.videoFile,"video");
     const cloudinaryThumbnailDelete = await deleteFile(videoToDelete.thumbnail,"image");
     if(!cloudinaryVideoDelete){
        throw new ApiError(400,"Video was not deleted from server");
     }
     if(!cloudinaryThumbnailDelete){
        throw new ApiError(400,"thumbnail was not deleted from server");
     }
     
    const video = await Video.deleteOne(videoToDelete);
    if(!video){
        throw new ApiError(400,"video was not deleted");
    }
    const videoLikesToDelete = await Like.deleteMany({video:videoId});
    if(!videoLikesToDelete){
        throw new ApiError(400,"Error while removing likes of video")
    }
     res.status(200).json(new ResponceApi(200,"The video was successfully deleted"))
});

const togglePublishStatus = asyncHandler(async (req,res)=>{
     const {videoId} = req.params;
     const video = await Video.findById(videoId);
     if(!video){
        throw new ApiError(400,"Error while fetching video")
     }
     video.isPublished ? video.isPublished=false : video.isPublished=true;
     await video.save({validateBeforeSave:false});
    res.status(200).json(new ResponceApi(200,"The isPublished is toggled"));
})

export {publishAVideo,getVideoById,updateThumbnail,updateVideoDetial,deleteVideo,togglePublishStatus,getAllVideos}