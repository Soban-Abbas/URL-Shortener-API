const urlModel = require("../models/urlSchema");
const { analytics }=require("../models/analytics")
const { encryptPassword } = require("../utils/encryptPassword");
const {nanoid} = require("nanoid")
const mongoose=require("mongoose")

const bcrypt=require("bcrypt");
exports.saveNewUrl = async (originalUrl, customUrl, password) => {
    try {

        let encryptedPassword;
        if (password) {
            encryptedPassword = await encryptPassword(password);
        }


        if (customUrl) {
            const alreadyExist = await urlModel.url.findOne({ shortUrl: customUrl }).exec();
            if (alreadyExist) {
                const error=new Error("Custom Url not available")
                error.status=409;
                throw error
            }
        }


        let exit = true;
        let generateshortUrl;
        while (exit) {
        
            generateshortUrl = nanoid(10);
        
            const shorturl = await urlModel.url.findOne({ shortUrl: generateshortUrl }).exec();
            if (!shorturl) {
                exit = false
            }
        }
    
        const newUrl = new urlModel.url({
            customId:nanoid(),
            originalUrl: originalUrl,
            shortUrl: customUrl || generateshortUrl,
            password: encryptedPassword || null,
            clickCount: 0,
            expiresAt:new Date(Date.now()+24*60*60*1000)

        })

        await newUrl.save();
return{
    id:newUrl.customId,
    originalUrl:newUrl.originalUrl,
    shortUrl:newUrl.shortUrl,
    totalClicks:newUrl.clickCount
}
        
        
    } catch (error) {
        throw error
    }
}


exports.verifyShortUrl = async (shortUrl, password,ip, userAgent,referrer)=>{
    try {
        
const shortUrlExists=await urlModel.url.findOne({shortUrl:shortUrl}).exec();
if(!shortUrlExists){
    const error=new Error("No Such Url Exist please try something else")
    error.status=404;
    throw error
    return
}

if(shortUrlExists.password!==null && password===null){
    const error=new Error("url is password protected ");
error.status=401;
throw error;
return
}


if(shortUrlExists.password && password){

    const comparepassword = await bcrypt.compare(password, shortUrlExists.password);

    if (!comparepassword) {
        const error = new Error("Wrong url or password");
        error.status = 401;
        throw error;
        return
    }
}


        await this.setAnalysis(shortUrlExists._id, shortUrlExists.expiresAt,ip,userAgent,referrer);
return shortUrlExists.originalUrl

    } catch (error) {
        throw error
    }
}



exports.setAnalysis=async(id,expiryTime,ip,userAgent,referrer)=>{
    try {
        const analysis=new analytics({
            urlId:id,
            expiryTime:expiryTime,
            ip:ip,
            userAgent:userAgent,
            referrer:referrer

        })
        await analysis.save();
        await urlModel.url.updateOne(
            { _id:id},
            { $inc: { clickCount: 1 } }
        )
    } catch (error) {
        throw error
    }
}



exports.getAnalysis=async(customId,password)=>{
    try {
        
        const url=await urlModel.url.findOne({customId:customId}).exec();
        
        if(!url){
            const error=new Error("Url Not Found");
            error.status=404;
            throw error;
            return
        }

        if(url.password!==null && password===null){
            const error = new Error("Please enter password");
            error.status = 401;
            throw error;
            return
        }
        if(url.password && password){
            const comparePassword=await bcrypt.compare(password,url.password);
            if(!comparePassword){
                const error = new Error("Wrong Url or password");
                error.status = 401;
                throw error;
                return
            }
        }

            

            const findanalysis=(await analytics.find({urlId:url._id})).map(a=>{
                return {
                  ip:  a.ip,
                  userAgent:a.userAgent,
                  referrer:a.referrer,
                  visitedAt:a.createdAt
                }
            });

            const analysis={
              originalUrl:  url.originalUrl,
              shortUrl:url.shortUrl,
              totalClicks:url.clickCount,
              visitor:findanalysis
            }

            return analysis



        
    } catch (error) {
        throw error
    }
}
