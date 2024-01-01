import dotenv from 'dotenv'; 
import connectDB from "./db/index.js";
import app from './app.js';
dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.on('error',(error)=>{
        console.log("express error: ",error);
    })
})
.then(()=>{
    app.listen(process.env.PORT|| 8000, ()=>{
        console.log(`server running on Port: ${process.env.PORT}`);
    })
})
