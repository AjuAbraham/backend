import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ResponceApi} from '../utils/responceApi.js'



    // step1-> get user detials
    // step2-> handling files ( avatar and coverImage) in router
    // step3-> check if any field is empty(only text not file right now
    // step4-> Check if user exsist or not
    // step5-> upload image (avatar,coverImage) to cloudnary and again check avatar as it is required
    // step6-> create object and do entry in DB 
   //  step7-> Remove password and refreshToken from the return info of DB
   //  step8-> return responce by responceApi file imported from util


const registerUser = asyncHandler(async(req,res)=>{
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
        console.log(coverImage)
        if(!avatar){
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

export {registerUser}