const { analytics } = require("../models/analytics");
const urlModel=require("../models/urlSchema");
const urlService=require("../services/urlService")




exports.postUrl=async(req , res , next )=>{
    try {
        const originalUrl=req.body.url;
        const customUrl=req.body.customUrl || false;
        const password= req.body.password || null;


const newUrl= await urlService.saveNewUrl(originalUrl,customUrl,password);
const shortUrl=`http://localhost:3000/${newUrl.shortUrl}`;
res.status(201).json({
    id: newUrl.id,
    originalUrl:newUrl.originalUrl,
    shortUrl:shortUrl,
    totalClicks:newUrl.totalClicks
})

    } catch (error) {
        next(error)
    }
}

exports.redirect=async(req , res , next)=>{
    try {
        const password=req.body?.password || null;
    const shortUrl=req.params.shortUrl;
console.log("hello")
const validateshortUrl=await urlService.verifyShortUrl(shortUrl,password)

console.log(validateshortUrl)
res.redirect(validateshortUrl);
    } catch (error) {
        next(error)
    }
    

}