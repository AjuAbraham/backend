import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/responceApi.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    res.staus(200).json(200,"ok");
})

export {
    healthcheck
    }