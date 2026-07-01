import mongoose from "mongoose"

const boardSchema = new mongoose.Schema({
    name:String,
    userId:mongoose.Schema.Types.ObjectId,
    tickets:[mongoose.Schema.Types.ObjectId]
})