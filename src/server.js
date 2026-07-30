const express=require("express");
const { connectToDatabase }=require('../src/db/setupdb')
require('dotenv').config()
const app=express()

async function startServer(app) {
    try {
        await connectToDatabase();
        app.listen(3000,()=>{
            console.log("server is successfully started")
        })
    } catch (error) {
        console.log(error)
    }
}

startServer(app)