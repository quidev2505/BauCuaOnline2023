const mongoose = require('mongoose');

const roomUserSchema = new mongoose.Schema({
    nickname: String,
    tongxu: Number,
    socketID : String
})

module.exports = mongoose.model('roomUserModel', roomUserSchema)