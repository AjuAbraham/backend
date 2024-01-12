import {asyncHandler} from '../utils/asyncHandler.js'
import { Video } from '../models/video.model.js'
import {ApiError} from '../utils/apiError.js'
import {deleteFile, uploadOnCloudinary} from '../utils/cloudinary.js'
import { ResponceApi } from '../utils/responceApi.js'

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
        owner: req.user._id
    })
    console.log("video is: ",video);
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
       const video = await Video.findById(videoId);
       if(!video){
        throw new ApiError(404,"no such video exsist");
       }
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
     res.status(200).json(new ResponceApi(200,"The video was successfully deleted"))
});

const togglePublishStatus = asyncHandler(async (req,res)=>{
     const {videoId} = req.params;
     const video = await Video.findById(videoId);
     if(!video){
        throw new ApiError(400,"Error while fetching video")
     }
     video.isPublished ? video.isPublished=false : video.isPublished=true;
     console.log(video.isPublished);
     await video.save({validateBeforeSave:false});
    res.status(200).json(new ResponceApi(200,"The isPublished is toggled"));
})

export {publishAVideo,getVideoById,updateThumbnail,updateVideoDetial,deleteVideo,togglePublishStatus}