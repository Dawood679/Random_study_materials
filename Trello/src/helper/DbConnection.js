import mongoose from "mongoose";

const connectDB = async()=>{
    try{


        const res = await mongoose.connect("mongodb://localhost:27017/trello")
        console.log("Connected to MongoDB")
    }catch(error){
        console.error("Error connecting to MongoDB:", error)
    }
}


export default connectDB