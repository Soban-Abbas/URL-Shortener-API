const urlModel = require("../models/urlSchema");
const { encryptPassword } = require("../utils/encryptPassword");
const {nanoid} = require("nanoid")
const mongoose=require("mongoose")
exports.saveNewUrl = async (originalUrl, customUrl, password) => {
    try {

        let encryptedPassword;
        if (password) {
            encryptedPassword = await encryptPassword(password);
        }


        if (customUrl) {
            const alreadyExist = await urlModel.url.findOne({ shortUrl: customUrl }).exec();
            if (alreadyExist) {
                const error=new Error("Url alredy taken")
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