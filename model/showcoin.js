const mongoose = require('mongoose');

const showcoinSchema = new mongoose.Schema({
    id:{
        type:String,
        default:'saveimg'
    },
    nai: Number,
    bau:Number,
    ga: Number,
    ca: Number,
    cua: Number,
    tom: Number
})

module.exports = mongoose.model('showcoinModel', showcoinSchema)