import { Playlist } from "../models/playlist.model.js";
import {ResponceApi} from '../utils/responceApi.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import mongoose, { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler(async(req,res)=>{
     const {name,description} = req.body;
     if(!(name || description)){
        throw new ApiError(400,"Name and description are required to create playlist");
     }
     const createPlaylist = await Playlist.create({
        name,
        description,
        owner:req.user._id
     })
     const check = await Playlist.findById(createPlaylist?._id);
     if(!check){
        throw new ApiError(400,"Playlist was not created")
     }
     res.status(200).json(
       new ResponceApi(200,{name:check.name,description:check.description},"playlist created successfully")
     )
})

const getUserPlaylists = asyncHandler(async(req,res)=>{
    const {userId}= req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid Object Id");
    }
    const playlist = await Playlist.aggregate([
        {
        $match:{
            owner: new mongoose.Types.ObjectId(userId),
        }
       },
       {
        $lookup:{
            from:"videos",
            localField:"video",
            foreignField:"_id",
            as:"video",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    username:1,fullname:1,avatar:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                },
                {
                    $project:{
                        videoFile:1,thumbnail:1,title:1,description:1,owner:1,duration:1,views:1
                    }
                }
            ]
        }
       },
       {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"playlistOwner",
            pipeline:[
                {
                    $project:{
                        username:1,fullname:1,avatar:1
                    }
                }
            ]
        }
       },
       {
        $project:{
            name:1,
            description:1,
            video:1,
            playlistOwner:1,
            createdAt:1
        }
       },
     ])
     console.log("playlist:",playlist);
    if(!playlist.length){
        throw new ApiError(400,"unable to fetch playlist")
    }
    console.log("playlist:",playlist)
    res.status(200)
       .json(new ResponceApi(200,playlist,"Playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req,res)=>{
     const {playlistId} = req.params;
     if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist ID");
     }
     const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId),
            }
           },
           {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,fullname:1,avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    },
                    {
                        $project:{
                            videoFile:1,thumbnail:1,title:1,description:1,owner:1,duration:1,views:1
                        }
                    }
                ]
            }
           },
           {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"playlistOwner",
                pipeline:[
                    {
                        $project:{
                            username:1,fullname:1,avatar:1
                        }
                    }
                ]
            }
           },
           {
            $project:{
                name:1,
                description:1,
                video:1,
                playlistOwner:1,
                createdAt:1
            }
           },
     ])
     if(!playlist.length){
        throw new ApiError(400,"Failed to retreive playlist");
     }
     console.log("playlist: ",playlist)
     res.status(200)
        .json(new ResponceApi(200,playlist,"Successfully retrived playlist"))
})

const addVideoToPlaylist = asyncHandler(async (req,res)=>{
    const {videoId,playlistId}= req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid video Id");
    }

    const playlistToAddVideo = await Playlist.findByIdAndUpdate(playlistId,{
        $addToSet:{
            video:videoId
        }
    },{new:true});
    if(!playlistToAddVideo){
        throw new ApiError(400,"Unable to fetch playlist")
    }

    res.status(200)
       .json(new ResponceApi(200,playlistToAddVideo,"video added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId, videoId} = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid video Id");
    }

    const playlistToRemoveVideo = await Playlist.findByIdAndUpdate(playlistId,
           {
            $pull: {
                video: {$in: [videoId]}
            }
           },{new:true})
    if(!playlistToRemoveVideo){
        throw new ApiError(400,"Video was not deleted")
    }
    res.status(200)
       .json(new ResponceApi(200,"Video removed successfully"))
    })



const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid video Id");
    }
    const result = await Playlist.deleteOne({_id:playlistId})
    if(!result){
        throw new ApiError(400,"Unable to delete playlist")
    }
    res.status(200)
        .json(new ResponceApi(200,"playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid video Id");
    }
    if(!(name|| description)){
        throw new ApiError(400,"name or description is required to update the playlist")
    }
    const playlistUpdate = await Playlist.findByIdAndUpdate(playlistId,{
        $set:{name,description}
    },{new:true});

    if(!playlistUpdate){
        throw new ApiError(400,"unable to update playlist")
    }
    res.status(200)
       .json(new ResponceApi(200,playlistUpdate,"updated successfully"))
})





export {createPlaylist,getUserPlaylists,getPlaylistById,addVideoToPlaylist,removeVideoFromPlaylist,deletePlaylist,updatePlaylist}