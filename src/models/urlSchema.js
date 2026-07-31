const {Schema,model}=require("mongoose");

const ObjectId = Schema.ObjectId;;


const urlSchema=new Schema({
    originalUrl:{type:String,required:true},
    shortUrl:{type:String,require:true,unique:true},
    password:{type:String,default:null,required:false},
    customAlias:{type:Boolean,default:false},
    clickCount:{type:Number,default:0}
},{timestamps:true});
urlSchema.index({createdAt : 1},{expireAfterSeconds:3600})

exports.url=model('urls',urlSchema);