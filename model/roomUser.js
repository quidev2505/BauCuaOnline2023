const mongoose = require('mongoose');

const roomUserSchema = new mongoose.Schema({
    nickname: String,
    tongxu: Number,
    anhdaidien:String,
    socketID : String
})

module.exports = mongoose.model('roomUserModel', roomUserSchema)