const express = require('express')
const router = express.Router()

router.get('/', (req, res)=>{
    res.send('mac dinh')
})

router.get('/new',(req, res)=>{
    res.send('them moi')
})

module.exports = router