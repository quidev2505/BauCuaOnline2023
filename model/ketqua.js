const mongoose = require('mongoose');

const ketquaSchema = new mongoose.Schema({
    idphong: {
        type: String,
        default: 'newyear'
    },
    ketqua: String
})

module.exports = mongoose.model('ketquaModel', ketquaSchema)