const mongoose=require("mongoose");
require('dotenv').config()

exports.connectToDatabase=async()=>{
    try {
        const url = process.env.url;
        await mongoose.connect(url);
        console.log("Database connected successfully.");
    } catch (error) {
        throw error
    }
}