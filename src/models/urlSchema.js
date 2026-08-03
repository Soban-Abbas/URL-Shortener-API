const { Schema, model } = require("mongoose");
const mongoose = require("mongoose")
const ObjectId = Schema.ObjectId;;


const urlSchema = new Schema({
    customId: { type: String, required: true, unique: true },
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, require: true, unique: true },
    password: { type: String, default: null, required: false },
    clickCount: { type: Number, default: 0 },
    expiresAt:{type:Date,default:null}
}, { timestamps: true });
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

exports.url = mongoose.model('urls', urlSchema);