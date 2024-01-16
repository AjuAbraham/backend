import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app =express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({
    limit:process.env.LIMIT,
}))
app.use(express.urlencoded({
    limit:process.env.LIMIT,    
    extended:true,
}))

app.use(cookieParser());


// routes
import userRoutes from './routes/user.routes.js';
import videoRoutes from './routes/video.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import likeRoutes from './routes/like.routes.js';
import commentRoutes from './routes/comment.routes.js';
//routes decleration

app.use('/api/v1/users',userRoutes);
app.use('/api/v1/videos',videoRoutes);
app.use('/api/v1/tweets',tweetRouter);
app.use('/api/v1/subscriptions',subscriptionRoutes)
app.use('/api/v1/likes',likeRoutes)
app.use('/api/v1/comments',commentRoutes)
export  default app;