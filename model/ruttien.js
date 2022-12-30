const mongoose = require('mongoose');

const ruttienSchema = new mongoose.Schema({
    tennguoichoi: String,
    sotienrut: String,
    thoigian: String
})

module.exports = mongoose.model('ruttienModel', ruttienSchema)