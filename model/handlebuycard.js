const mongoose = require('mongoose');

const handlebuyCardSchema = new mongoose.Schema({
    socket_id: String
})

module.exports = mongoose.model('handlebuyCardModel', handlebuyCardSchema)