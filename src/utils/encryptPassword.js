const bcrypt=require("bcrypt");
exports.encryptPassword=async(password)=>{
    try {
        const encryptedPassword=await bcrypt.hash(password,10);

        return encryptedPassword
    } catch (error) {
        throw error
    }
}