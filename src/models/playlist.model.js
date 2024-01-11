import mongoose from "mongoose";


const playlistSchema = new mongoose.Schema({
      name:{
        type:String,
        required:true,
        unique:true,
      },
      videos:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
      ],
      description:{
           type:String,
           required:[true,"Playlist description is required"]
      },
      owner:{
        type: mongoose.Schema.ObjectId,
        ref:"User"
      }
},{timestamps:true})



export const Playlist = mongoose.model("Playlist",playlistSchema)