
import jwt from "jsonwebtoken"

function auth(req,res,next){
    const accessToken = req.cookies.accessToken
    if(!accessToken){
        return res.status(401).json({message:"Access token not found"})
    }

    try{
        console.log("Access token:", accessToken); // Log the access token for debugging
        const decoded = jwt.verify(accessToken,process.env.JWT_SECRET || "dawoodalam")
        console.log("Decoded token:", decoded); // Log the decoded token for debugging
        req.userId = decoded.userId
        next()
    }
    catch(error){
        return res.status(401).json({message:"Invalid access token"})
    }   

}


export default auth