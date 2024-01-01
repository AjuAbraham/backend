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

//routes decleration

app.use('/api/v1/users',userRoutes);


export  default app;