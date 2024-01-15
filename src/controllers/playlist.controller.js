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
    const playlists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
             $lookup:{
                from: "videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $project:{
                            videoFile:1,
                            thumbnail:1,
                            owner:1,
                            title:1,
                            duration:1,
                            views:1
                        }
                    }
                ]
             }
        },
        {
             $addFields:{
                videos: {
                    $first: "$videos"
                }
             }
        }
    ]) 
    if(!playlists.length){
        throw ApiError(400,"unable to fetch playlist")
    }
    res.status(200)
       .json(new ResponceApi(200,playlists[0],"Playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req,res)=>{
     const {playlistId} = req.params;
     if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist ID");
     }
     const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: playlistId,
            }
        },
        {
            $lookup:{
                from:"videos",
                localField: "videos",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $project:{
                            videoFile:1,
                            thumbnail:1,
                            owner:1,
                            title:1,
                            duration:1,
                            views:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                videos:{
                    $fist: "$videos"
                }
            }
        }
     ])
     if(!playlist.length){
        throw new ApiError(400,"Failed to retreive playlist");
     }
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
        $set: {videos:videoId}
    },{new:true})
    
    if(!playlistToAddVideo){
        throw new ApiError(400,"Unable to add video to playlist")
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
                videos: {$in: [videoId]}
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
    const result = await Playlist.findByIdAndUpdate(playlistId,{
        $unset:{name:1,description:1,videos:1}
    })
    const check = await Playlist.findById(playlistId);
    if(check){
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





export {createPlaylist,getUserPlaylists,addVideoToPlaylist,removeVideoFromPlaylist,deletePlaylist,updatePlaylist}