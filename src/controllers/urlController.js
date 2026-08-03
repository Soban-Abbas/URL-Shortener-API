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
 const userAgent=req.get('user-Agent');
const ip=req.ip;
const referrer=req.get('Referrer') || null;
const validateshortUrl=await urlService.verifyShortUrl(shortUrl,password,ip,userAgent,referrer)

res.redirect(validateshortUrl);
    } catch (error) {
        next(error)
    }
    

}


exports.getAnalysis=async(req , res , next)=>{
    try {
        const urlId=req.params.id;
        const password=req.body?.password || null;

        const getAnalysis=await urlService.getAnalysis(urlId,password)
        res.status(200).json({
          analysis:  getAnalysis
        })
    } catch (error) {
        next(error)
    }
}