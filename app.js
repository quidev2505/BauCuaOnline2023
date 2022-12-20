const express = require('express')
const multer = require('multer');
const app = express()
//Dành cho socketio
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


var bodyParser = require('body-parser')
var session = require('express-session')
const port = 3000


//Kết nối mongodb
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin123:admin123ok@baucua.oqtswzp.mongodb.net/?retryWrites=true&w=majority').then(()=>console.log('Ket nối DB thành công')).catch(()=>console.log('Kết nối DB thất bại'))


// Use the session middleware
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: "secret"
}));

//Su dung Static File
app.use(express.static(__dirname + '/public'))


app.set('view engine','ejs')

//Body_parser cho form có dạng POST
// create application/json parser
var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })


//cấu hình lưu trữ file khi upload xong
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      //files khi upload xong sẽ nằm trong thư mục "uploads" này - các bạn có thể tự định nghĩa thư mục này
      cb(null, './public/uploads') 
    },
    filename: function (req, file, cb) {
      // tạo tên file = thời gian hiện tại nối với số ngẫu nhiên => tên file chắc chắn không bị trùng
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) 
      cb(null, filename + '-' + file.originalname )
    }
  })
//Khởi tạo middleware với cấu hình trên, lưu trên local của server khi dùng multer
const upload = multer({ storage: storage })


//Su dung router
// const homeRouter = require('./routes/home')
// app.use('/home', homeRouter)


//Sử dụng get va post cho các trang
//Trang đăng nhập
app.get('/login', (req, res)=>{
    res.render('login')
})


app.post('/login',urlencodedParser, (req, res)=>{
    const username_input = req.body.username;
    const password_input = req.body.password;
    
    if(username_input === 'admin123' && password_input === 'admin456'){
        res.redirect('/admin');
    }else{
        var userModel = require('./model/userModel');
        userModel.findOne({tendangnhap: username_input, matkhau: password_input})
            .then((data)=>{
                //Khi đã đúng tên tài khoản thì thực hiện chuyển trang
                if(data){
                    //Thực hiện lưu vào localStorage cho lần đăng nhập sau đó.
                   
                    // localStorage.setItem('remember_login',JSON.stringify(account_remember))
                    // res.render('mainScreen', {userInfo: data})
                    // res.session.dataUser = data
                    // console.log(data)
                    //Lay id cua tung user gan cho session
                    req.session.id_userData = data._id.toString();
                    
                    res.redirect('/mainScreen');
                }else{
                    res.render('login',{err_login: "Sai tên tài khoản hoặc mật khẩu !"})
                }
            })
            .catch(()=>{res.redirect('/404_page')})
    }

})


//Trang đăng kí tài khoản
app.get('/register', (req, res)=>{
    res.render('register')
})

app.post('/register',upload.single('formFile'),urlencodedParser, (req, res)=>{
    const username_input = req.body.username;
    const password_input = req.body.password;
    const nickname_input = req.body.nickname;
    //nhận dữ liệu từ form
    const file = req.file;
 
    
    // Kiểm tra nếu không phải dạng file thì báo lỗi
    // if (!file) {
    //     const error = new Error('Upload file again!')
    //     error.httpStatusCode = 400
    //     return next(error)
    // }
    // file đã được lưu vào thư mục uploads
    // gọi tên file: req.file.filename và render ra màn hình
 


    const userModel = require('./model/userModel');
    //Tìm xem trong DB đã có tài khoản nào trùng không
    userModel.findOne({tendangnhap: username_input})
        .then((data)=>{
            //Khi đã đúng thì chắc chắn đã có 1 tài khoản
            if(data){
                res.render('register',{duplicated_username: "Tài khoản đã tồn tại !"})
            }else{
                //Khi chưa có tồn tại tài khoản trước đó
                userModel.create({
                    tendangnhap: username_input,
                    matkhau: password_input,
                    nickname: nickname_input,
                    anhdaidien: file.filename
                }).then((data)=>
                    {
                        req.session.id_userData = data._id.toString();
                        res.redirect('/mainScreen');
                    }
                ).catch(()=>res.redirect('/404_page'))
            }
        })
        .catch(()=>{res.redirect('/404_page')})
})

//Trang chủ
app.get('/', (req, res)=>{
    res.render('home')
})


//Trang màn hình chính
app.get('/mainScreen',(req, res)=>{
    const userModel = require('./model/userModel');
    const idUser = new mongoose.mongo.ObjectId(req.session.id_userData);

    userModel.findOne({_id: idUser})
        .then((data)=>{
            res.render('mainScreen', {userInfo:  data})
        })
        .catch(()=>res.redirect('/404_page'))
})


//Trang đăng xuất
app.get('/logout', (req, res)=>{
    req.session.destroy();
    res.render('home');
})


//Trang lỗi
app.get('/404_page',(req, res)=>{
    res.render('404_page')
})

//Trang admin
app.get('/admin',(req, res)=>{
    const buyCardModel = require('./model/buyCard');
    buyCardModel.find().then((data)=>{
        res.render('admin' , {buyCardInfo : data})
    }).catch(()=>res.redirect('/404_page'))
})

var check_user_buy_card = 0;
io.on('connection', (socket) => {
    // console.log('Số người hiện đang kết nối '+ socket.client.conn.server.clientsCount)
    // console.log('Người chơi '+ socket.id)

    // Khi phát hiện có người tham gia vào phòng chơi
    socket.on('NewUserJoinRoom', (userNameJoinRoom)=>{
        const roomUserModel = require('./model/roomUser');
        roomUserModel.create({
            nickname: userNameJoinRoom.nickname,
            tongxu: userNameJoinRoom.tongxu,
            socketID :userNameJoinRoom.socketID
        })

        socket.broadcast.emit('notification_joinRoom', userNameJoinRoom.nickname)

        //Khi có người mới vào phòng sẽ tạo ra các element hiển thị trên giao diện bàn chơi
        roomUserModel.find().then((data)=>{
            socket.emit('createElementUser', data)
        })

    })


    //Khi bấm vào nút xem người chơi trong phòng
    socket.on('showuserinRoom',()=>{
        const roomUserModel = require('./model/roomUser');
        roomUserModel.find().then((data)=>{
            socket.emit('showuserinRoomClient', data)
        })
    })

    check_user_buy_card++;

    if(check_user_buy_card == 3){
        socket.emit('waitingUser', 'fullUser')
    }

    socket.on('userOnline', (data)=>{
        socket.broadcast.emit('userOnline', data)
    })

    //Khi đã xác nhận nạp tiền từ phía admin
    socket.on('accept_buy_card', (data)=>{
        const userModel = require('./model/userModel');
        const nickname = data.nickname;
        const tongxu = data.tongxu;
        const money = data.money
        const tongxu_update = parseInt(tongxu) + parseInt(money);

        //Cập nhật lại tiền
        userModel.findOneAndUpdate({nickname: nickname}, {tongxu: tongxu_update},{new: true})
        .then(()=>{
            socket.broadcast.emit("accept_buy_card", "xacnhan")
        })

        var date = new Date();
        var current_date = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+ date.getDate();
        var current_time = date.getHours()+":"+date.getMinutes()+":"+ date.getSeconds();
        var date_time = current_date+" "+current_time;	
        
        const buyCardModel = require('./model/buyCard');
        buyCardModel.create({
            tennguoichoi: nickname,
            sotiennap: money,
            thoigian: date_time
        })
    })


     //Khi từ chối nạp tiền từ admin
    socket.on('deny_buy_card', (data)=>{
        socket.broadcast.emit("deny_buy_card", "xacnhan")    
    })
    
    socket.on('disconnect', () => {
        const roomUserModel = require('./model/roomUser');
        roomUserModel.findOne({socketID: socket.id}).then((data)=>{ 
            roomUserModel.findOneAndRemove({socketID: socket.id})
            io.emit('user disconnected',data.nickname);
            roomUserModel.findOneAndRemove({socketID: socket.id},
                function (err, docs) {
                if (err){
                    console.log(err)
                }
                else{
                    console.log(docs);
                }
        })
    })

        check_user_buy_card--;
        console.log('Người chơi '+ socket.id + ' đã ngắt kết nối!');
    });
});

//Trang nạp xu
app.get('/buy_card', (req, res)=>{
const userModel = require('./model/userModel');
const idUser = new mongoose.mongo.ObjectId(req.session.id_userData);

userModel.findOne({_id: idUser})
    .then((data)=>{
        res.render('buy_card', {userInfo:  data})
    })
    .catch(()=>res.redirect('/404_page'))
})


//Trang phòng chơi game
app.get('/join_room',(req, res)=>{
    const userModel = require('./model/userModel');
    const idUser = new mongoose.mongo.ObjectId(req.session.id_userData);

    userModel.findOne({_id: idUser})
        .then((data)=>{
            res.render('join_room', {userInfo:  data})
        })
        .catch(()=>res.redirect('/404_page'))   
})

app.get('/404_page',(req, res)=>{
    res.render('404_page')
})

server.listen(3000, ()=>{
    console.log(`Ket noi thanh cong server voi cong port = ${port}`)
})

