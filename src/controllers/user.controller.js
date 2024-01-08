import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ResponceApi} from '../utils/responceApi.js'


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

const loginUser = asyncHandler(async (req,res)=>{
    // get inforamtion from req.body
    // username or email exsist or not and check if user exsist or not
    // password check
    // generate access and refresh token
    // send in cookie format
 
  
    const {email,username,password} = req.body;
    if(!(username ||email)){
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
export {registerUser,loginUser,logOutUser}