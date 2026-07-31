const express=require("express");

const router=express.Router()

const urlController=require("../controllers/urlController");
const { isUrl } = require("../validators/validateUrl");
router.post('/url', isUrl,urlController.postUrl)


module.exports=router;