import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema({
     videoFile:{
        type:String,  //cloudnary
        required:[true,"Video file must be added"]
     },
     thumbnail:{
        type:String,
        required:[true,"Thumbnail is required"],
     },
     owner:{
         type: mongoose.Schema.ObjectId,
         ref:"User"
     },
     title:{
        type:String,
        required:true,
     },
     description:{
        type:String,
        required:true,
     },
     duration:{
        type:Number,
        required:true,
     },
     views:{
        type:Number,
        default:0,
     },
     isPublished:{
         type:Boolean,
         default:false,
     }

},{timestamps:true})
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema);