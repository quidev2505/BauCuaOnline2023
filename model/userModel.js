const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    tendangnhap: String,
    matkhau: String,
    nickname: String,
    anhdaidien: String,
    tongxu: {
        type: Number,
        default: 5
    }
})

module.exports = mongoose.model('userModel', userSchema)