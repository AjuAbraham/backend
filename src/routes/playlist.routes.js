import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
import {verifyJwt} from '../middlewares/auth.middleware.js'

const playlistRoutes = Router();
playlistRoutes.use(verifyJwt);


playlistRoutes.route('/create-playlist').post(createPlaylist);
playlistRoutes
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

playlistRoutes.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
playlistRoutes.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
playlistRoutes.route("/user/:userId").get(getUserPlaylists);
export default playlistRoutes