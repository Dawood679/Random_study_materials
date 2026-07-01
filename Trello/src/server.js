import express from "express"
import connectDb from "./helper/DbConnection.js"
import User from "./models/User.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import auth from "./Middleware/auth.js"
import cookieParser from "cookie-parser"
const app = express()


app.use(express.json())

app.use(express.urlencoded({extended:true}))
app.use(cookieParser())


app.post("/login",async(req,res)=>{
    const { email, password } = req.body

    if(!email || !password){
        return res.status(400).json({message:"Email and password are required"})
    }   
    const passwordConverter = await bcrypt.hash(password,10)

    const user = await User.findOne({
        email:email,
    })

    if(!user){
        return res.status(404).json({message:"User not found"})
    }
    
    const isPasswordValid = await bcrypt.compare(password,user.password)


    if(!isPasswordValid){
        return res.status(401).json({message:"Invalid password"})
    }

    const accesstoken = jwt.sign({userId:user._id},process.env.JWT_SECRET || "dawoodalam",{
        expiresIn:"1min"
    })

    const refreshtoken = jwt.sign({userId:user._id},process.env.JWT_SECRET || "dawoodalam",{
        expiresIn:"7d"
    })

   


    res.cookie("accessToken",accesstoken,{ httpOnly:true })
    res.cookie("refreshToken",refreshtoken,{ httpOnly:true })
    return res.status(200).json({message:"Login successful", token:accesstoken})



})


app.get("/protected",auth,(req,res)=>{
    return res.status(200).json({message:"Protected route accessed", userId:req.userId})
})


app.post("/register",async(req,res)=>{
    const {email,password} = req.body


    if(!email || !password){
        return res.status(400).json({message:"Email and password are required"})
    }
    const hashedPassword =  await bcrypt.hash(password,10)
    const userExists = await User.findOne({email})
    if(userExists){
        return res.status(400).json({message:"User already exists"})
    }
   const createUser = await User.create({
    email,
    password:hashedPassword
   })


  return  res.json({message:"User created successfully", user:createUser})

})


app.get("/refresh",(req,res)=>{

    const refreshToken = req.cookies.refreshToken

    if(!refreshToken){
        return res.status(401).json({message:"Refresh token not found"})
    }
    
    try{
        const decoded = jwt.verify(refreshToken,process.env.JWT_SECRET || "dawoodalam") 
        if(!decoded){
            return res.status(401).json({message:"Invalid refresh token"})
        }
        const newAccessToken = jwt.sign({userId:decoded.userId},process.env.JWT_SECRET || "dawoodalam",{
        expiresIn:"1h"
    })

    

    const newToken = {
        accessToken:newAccessToken,
    }
    res.clearCookie("accessToken")

    res.cookie("accessToken",newToken,{ httpOnly:true })
    return res.status(200).json({message:"Token refreshed successfully", token:newToken})
    }
    catch(error){
        return res.status(401).json({message:"Invalid refresh token"})
    }

    
})




app.listen("3000", () => {

    connectDb()
    console.log("Server is running on port 3000")
}   )