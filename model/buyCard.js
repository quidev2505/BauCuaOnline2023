const mongoose = require('mongoose');

const buyCardSchema = new mongoose.Schema({
    tennguoichoi: String,
    sotiennap: Number,
    thoigian: String
})

module.exports = mongoose.model('buyCardModel', buyCardSchema)