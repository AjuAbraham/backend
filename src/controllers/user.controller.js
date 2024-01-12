import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import mongoose from 'mongoose'
import {User} from '../models/user.model.js'
import {deleteFile, uploadOnCloudinary} from '../utils/cloudinary.js'
import {ResponceApi} from '../utils/responceApi.js'
import  Jwt  from 'jsonwebtoken'

const generateAcessAndRefreshToken = async(userId)=>{
     try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken= refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
     } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
     }
}


const registerUser = asyncHandler(async(req,res)=>{
    // step1-> get user detials
    // step2-> handling files ( avatar and coverImage) in router
    // step3-> check if any field is empty(only text not file right now
    // step4-> Check if user exsist or not
    // step5-> upload image (avatar,coverImage) to cloudnary and again check avatar as it is required
    // step6-> create object and do entry in DB 
   //  step7-> Remove password and refreshToken from the return info of DB
   //  step8-> return responce by responceApi file imported from util



    //get user detials (only json and form related data can be obtained with body)
    const {fullname,email,username,password}= req.body;                           //step1
        if( [fullname,email,username,password].some((field)=>(
            field?.trim()===undefined                                                     //step3
        ))){
           throw ApiError(400,"All field are required")
        }
        const exsistedUser = await User.findOne({  
            $or: [{username},{email}]                                              //step4
        })
        if(exsistedUser){
            throw new ApiError(409,"User's email or username already exsist")
        }
        const avatarLocalPath = req.files?.avatar[0]?.path;     //step2 (middleware code in route file)
        const coverImageLocalPath =  req.files?.coverImage[0]?.path;
        if(!avatarLocalPath){
            throw new ApiError(400,"User's avatar is required")
        }
        
        const avatar=  await uploadOnCloudinary(avatarLocalPath);
        const coverImage= await uploadOnCloudinary(coverImageLocalPath);           //step5
        if(!avatar.url){
            throw new ApiError(400,"User's avatar is required ")
        }
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            password,
            email,
            username, 
        })
        const createdUser = await  User.findById(user._id);                        //step6
        if(!createdUser){
            throw new ApiError(500,"Something went wrong while regsitering the user")
        }

        createdUser.password = undefined;                                 //step7
        createdUser.refreshToken = undefined;                            
        return res.status(201).json(
             new ResponceApi(200,createdUser,"User Registered successfully")
        )
    })



const loginUser = asyncHandler(async (req,res)=>{
    // get inforamtion from req.body
    // username or email exsist or not and check if user exsist or not
    // password check
    // generate access and refresh token
    // send in cookie format
 
  
    const {email,username,password} = req.body;
    if(!(username || email)){
        throw new ApiError(400,"Username or email is required");
    }
    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"invalid username or email");
    }
    const passwordVerification = await user.isPasswordCorrect(password)
    if(!passwordVerification){
        throw new ApiError(401,"Invalid user password");
    }
    const {accessToken,refreshToken} = await generateAcessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const option = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
              .cookie("accessToken",accessToken,option)
              .cookie("refreshToken",refreshToken,option)
              .json(
                 new ResponceApi(200,{user:loggedInUser,accessToken,refreshToken},"user logged successfully")
              )
})


const logOutUser = asyncHandler(async (req,res)=>{
      await User.findByIdAndUpdate(req.user._id,
        {$set:{
            refreshToken:undefined
             }
        },
        {
            new:true,
        }
        )
        const option={
            httpOnly:true,
            secure:true,
        }
        return res.status(200)
                  .clearCookie("accessToken",option)
                  .clearCookie("refreshToken",option)
                  .json(
                    new ResponceApi(200,{},"User logged out")
                  )
})


const refreshAcessToken = asyncHandler(async(req,res)=>{
     const incomingRefreshToken = req.cookies.refreshToken|| req.body.refreshToken
     if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
     }
   try {
      const decodedToken = Jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
      const user = await User.findById(decodedToken?._id);
      if(!user){
         throw new ApiError(401,"Invalid refresh Token")
      }
     if(user?.refreshToken !== incomingRefreshToken){
         throw new ApiError(401,"Refresh token is expired or used");
     }
     const option = {
         httpOnly:true,
         secure:true,
     }
     const {accessToken,newRefreshToken}= await generateAcessAndRefreshToken(user._id);
     res.status(200)
     .cookie("accessToken",accessToken,option)
     .cookie("refreshToken",newRefreshToken,option)
     .json(
         new ResponceApi(200,{accessToken,refreshToken:newRefreshToken},"Acess Token refreshed")
     )
   } catch (error) {
        throw new ApiError(401,error?.message);
   }
})


const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const isoldPasswordRight = await user.isPasswordCorrect(oldPassword);
    if(!isoldPasswordRight){
        throw new ApiError(400,"Old password is incorrect");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave:false})
    res.status(200)
       .json(
        new ResponceApi(200,{newPassword:newPassword},"Password is updated successfully ")
       )
})


const currentUser = asyncHandler(async(req,res)=>{
    const user = await req.user;
    return res.status(200).json(
        new ResponceApi(200,{user},"Current user fetched successfully")
    )
})


const updateAccountDetial = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body;
    if(!(fullname || email)){
        throw new ApiError(400,"fullname or email is required to update the details");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
        $set:{fullname:fullname,email:email}
        },
        {new:true}
    ).select("-password -refreshToken")

    res.status(200)
       .json(
        new ResponceApi(200,user,"account detail updated successfully")
       )
})



const updateUserAvatar = asyncHandler(async(req,res)=>{
    const updatedAvatar = req.file?.path;
    if(!updatedAvatar){
        throw new ApiError(400,"Avatar is required to update");
    }
    const newAvatar = await uploadOnCloudinary(updatedAvatar);
    if(!newAvatar){
        throw new ApiError(400,"Some issue while uploading avatar on cloudinary");
    }

    const prevUser = await User.findById(req.user?._id);
        const imgRemove = await deleteFile(prevUser.avatar,"image");
        if(!imgRemove){
            throw new ApiError(400,"some issue occured while removing image");
        }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{avatar:newAvatar.url}
        },
        {new:true}
        ).select("-password -refreshToken")
    res.status(200)
       .json(
        new ResponceApi(200,user,"avatar updated successfully")
       )
})




const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const updatedCoverImage = req.file?.path;
    if(!updatedCoverImage){
        throw new ApiError(400,"CoverImage is required to update");
    }

    const newCoverImage = await uploadOnCloudinary(updatedCoverImage);
    if(!newCoverImage){
        throw new ApiError(400,"Some issue while uploading cover image on cloudinary");
    }
    const prevUser = await User.findById(req.user?._id);
    const imgRemove = await deleteFile(prevUser.coverImage,"image");
    if(!imgRemove){
        throw new ApiError(400,"some issue occured while removing image");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{coverImage:newCoverImage.url}
        },
        {new:true}
        ).select("-password -refreshToken")
    res.status(200)
       .json(
        new ResponceApi(200,user,"Cover Image updated successfully")
       )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400,"Some error while getting user channel")
    } 
    const channel = await User.aggregate([
        {
            $match:{
                username: username
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",                           //subscriber info
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",                           //subscribed To info
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                email:1,
                username:1,
                avatar:1,
                coverImage:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
            }
        }

    ])
    console.log("channel is: ",channel)
    if(!channel?.length){
        throw new ApiError(400,"Some issue while fetching channel ie channel does'nt exist")
    }
    console.log("channel returns : ",channel);
    res.status(200)
       .json(
        new ResponceApi(200,channel[0],"Channel fetched successfully")
       )
})

const getUserWatchHistroy = asyncHandler(async (req,res)=>{
      const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
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
                                $first: "$owner" // or $arrayElemAt:["$owner",0]
                            }
                        }
                    }
                ]
            },
        }
      ])
      res.status(200)
         .json(new ResponceApi(200,user[0].watchHistory,"Watch History fetched  successfully"))
})

export {registerUser,
    loginUser,
    logOutUser,
    refreshAcessToken,
    changePassword,
    currentUser,
    updateAccountDetial,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistroy,
}