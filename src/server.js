const express=require("express");
const bodyParser=require("body-parser")
const { connectToDatabase }=require('../src/db/setupdb')
require('dotenv').config()
const urlRoutes=require("../src/routes/urlRoutes")
const {globalErrorMiddleware}=require("../src/middlewares/globalErrorMiddleware")
const app=express()
app.use(bodyParser.json());





app.use(urlRoutes)
app.use('/',(req ,res , next)=>{
   return res.status(200).json({
        message:"wellcome to url shortner"
    })
})
app.use(globalErrorMiddleware)
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