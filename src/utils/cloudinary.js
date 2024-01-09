import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("the response is ",response);
        // file has been uploaded successfull
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteImage = async (imageUrl)=>{
    try {
        const parsedUrl = new URL(imageUrl);
        const publicId = parsedUrl.pathname.split('/').pop().split('.')[0];
        if(publicId===null){
            console.log("issue to get publicID:",publicId)
            return null;
        }
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result;
    } catch (error) {
        return null;
    }
}


export {uploadOnCloudinary,deleteImage}