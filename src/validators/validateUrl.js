const isUrl=require("is-url");

exports.isUrl=(req , res , next)=>{
    if(isUrl(req.body.url)){
        next()
    }else{
        res.status(422).json({
            error:"Invalid url"
        })
    }
}