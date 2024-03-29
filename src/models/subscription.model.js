import mongoose from "mongoose";


const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,  //the user who is subscribing
        ref: "User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,  //the user whom 'subscriber is subscribed to
        ref: "User"
    }

},{timestamps:true})


export const Subscription = mongoose.model("Subscription",subscriptionSchema);