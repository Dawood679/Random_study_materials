import mongoose from "mongoose"

const ticketSchema = new mongoose.Schema({
    title:String,
    description:String,
    boardId:mongoose.Schema.Types.ObjectId,
    userId:mongoose.Schema.Types.objectId
    
})