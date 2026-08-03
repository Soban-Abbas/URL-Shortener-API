const urlModel = require("../models/urlSchema");
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
            clickCount: 0

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


exports.verifyShortUrl=async(shortUrl,password)=>{
    try {
        
const shortUrlExists=await urlModel.url.findOne({shortUrl:shortUrl}).exec();
console.log(shortUrlExists)
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





return shortUrlExists.originalUrl

    } catch (error) {
        throw error
    }
}