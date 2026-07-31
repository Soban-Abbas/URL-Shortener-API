const {Schema,model }=require("mongoose");

const analyticsSchema=new Schema({
    urlId:{type: Schema.Types.ObjectId,ref:'urls',required:true},
    expiryTime:{type:Date,required:true},
    ip:{type:String},
    userAgent:{type:String,default:null},
    referrer:{type:String,default:null}

},{timestamps:true});

analytics.index({expiryTime:1},{expireAfterSeconds:0})


exports.analytics=model('analytics',analyticsSchema);
