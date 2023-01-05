const express = require('express')
const multer = require('multer');
const app = express()
//Dành cho socketio
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


//Xử lí form với body-parser
var bodyParser = require('body-parser')
var session = require('express-session')
const PORT = process.env.PORT || 3030;


//Xử lí âm thanh game với thư viện howler.js
// const {Howl, Howler} = require('howler');
// // Setup the new Howl.
// const sound = new Howl({
//   src: ['/audio/Tieng-khi-keu-www_tiengdong_com.mp3'],
//   onload(){
//     console.log('ok la')
//   },
//   onloaderror(e, msg){
//     console.log('error', e, msg)
//   }
// });

// Play the sound.
// sound.play();


//Kết nối mongodb
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin123:admin123ok@baucua.oqtswzp.mongodb.net/test?retryWrites=true&w=majority').then(()=>console.log('Ket nối DB thành công')).catch(()=>console.log('Kết nối DB thất bại'))


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
        req.session.admin_login = 'admin_login'
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


//Loading Page
app.get('/',(req, res)=>{
    res.render('firstScreen')
})

//Trang chủ
app.get('/home', (req, res)=>{
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
    if( typeof(req.session.admin_login) != 'undefined'){
        const buyCardModel = require('./model/buyCard');
        buyCardModel.find().then((data)=>{
            res.render('admin' , {buyCardInfo : data})
        }).catch(()=>res.redirect('/404_page'))
    }else{
        res.redirect('/home')
    }
})

var openRoom = 'true'


io.on('connection', (socket) => {
    const roomUserModel = require('./model/roomUser');
    const showCoinModel = require('./model/showcoin');
    // console.log('Số người hiện đang kết nối '+ socket.client.conn.server.clientsCount)
    // console.log('Người chơi '+ socket.id)


    //Diễn tả 2 trạng thái của phòng mở và đóng phòng
    socket.on('gamehavestart',(data)=>{
        openRoom = 'false'
    })


 

    console.log(openRoom)

    // Khi phát hiện có người tham gia vào phòng chơi
    socket.on('NewUserJoinRoom', (userNameJoinRoom)=>{
        if(openRoom == 'false'){
            socket.emit('dabatdau')
        }else{
        roomUserModel.count({}, function (err, count) {
            if (count > 8) {
                socket.emit('waitingUserInRoom', 'fullUserInRoom')
            } else {
                roomUserModel.create({
                    nickname: userNameJoinRoom.nickname,
                    tongxu: userNameJoinRoom.tongxu,
                    anhdaidien: userNameJoinRoom.anhdaidien,
                    socketID :userNameJoinRoom.socketID
                })
                socket.broadcast.emit('notification_joinRoom', userNameJoinRoom.nickname)
            }   
            })
        }
    })


    //Quan li tin nhan
    socket.on('datasendFromClient',(data)=>{
        io.emit('datasendFromAdmin',data)
    })
   
        //Quản lí chơi bầu cua
    // Tổng cộng Admin sẽ có 3 hành động
    // 1.Admin nhấn bắt đầu -> Sẽ lắc xúc xắc -> Cho thời gian đặt cược (20 giây) -> Hết thời gian đặt cược -> Tự khui xúc xắc -> Phát thưởng
    // 2.Admin nhấn vào bắt đầu lại trò chơi

    //Khi admin nhấn bắt đầu game
    socket.on('action1',()=>{
        io.emit('action1FromAdmin')
        const ketqua = require('./model/ketqua');
        const randomNumberNew = Math.ceil(Math.random()*216)
        let danhtinh = arrayNumber[randomNumberNew];
    
        let bobaso = {
            so1: danhtinhmoi(danhtinh[0]),
            so2: danhtinhmoi(danhtinh[1]),
            so3: danhtinhmoi(danhtinh[2])
        }

        let ketquanew = `${bobaso.so1}-${bobaso.so2}-${bobaso.so3}`;

        ketqua.findOneAndUpdate({idphong: 'newyear'}, {ketqua: ketquanew},{new: true})
        .then(()=>{
        
        })
    })

    //Khi nhận được thông báo khui từ phía client sẽ tạo ra ngẫu nhiên các cặp số
    socket.on('khuixucxac',(data)=>{
        const ketqua = require('./model/ketqua');
        let arrayUser = []
        let datcuocUser = []
        let mangbaucua = data.mangbaucua
        let nicknameUser = data.nicknameUser
   
        mangbaucua.forEach((item, index)=>{
            if(parseInt(item.soluong) > 0){
                arrayUser.push(item.ten)
                datcuocUser.push(`${item.ten} - ${item.soluong}`)
            }
        })

        ketqua.findOne().then((data)=>{
            let chuoikq = data.ketqua;
            let so1 = chuoikq.split("-")[0];
            let so2 = chuoikq.split("-")[1];
            let so3 = chuoikq.split("-")[2];
            let arrayKQ = [so1, so2, so3];
            
            let bobaso = {
                so1: so1,
                so2: so2,
                so3:so3
            }
            socket.broadcast.emit('bobasomaiman', bobaso);



            console.log('ket qua va nickname', arrayKQ + ''+nicknameUser);
            console.log('User va nickname', arrayUser+'-'+nicknameUser);
            
    
            let arrayKQFinal = []
            for(let i=0; i< arrayKQ.length; i++){
                let count = 0;
                for(let j=0;j<arrayUser.length; j++){
                    if(arrayKQ[i] == arrayUser[j]){
                        count++;
                    }
                }
                if(count > 0){
                    arrayKQFinal.push(`${arrayKQ[i]} - ${count}`)
                }
            }
    
    
            console.log('nickname'+arrayKQFinal+'-'+nicknameUser)
            console.log('nickname'+datcuocUser+'-'+nicknameUser)
    
            var tongtienthuduoc = 0;
            for(let i=0;i<arrayKQFinal.length;i++){
                let tenkq = arrayKQFinal[i].split("-")[0];
                let soluongkq = arrayKQFinal[i].split("-")[1];
                for(let j= 0;j<datcuocUser.length;j++){
                    let tendatcuoc= datcuocUser[j].split("-")[0]
                    let xudatcuoc= datcuocUser[j].split("-")[1]
    
                    if(tenkq == tendatcuoc){
                        tongtienthuduoc+=(parseInt(soluongkq * xudatcuoc)+parseInt(xudatcuoc))
                    }
                }
            }
            

            setTimeout(()=>{{
                let dataQT = {
                    nickname: nicknameUser,
                    tongtien: tongtienthuduoc
                }
                io.emit('tienxuthuduoc', dataQT)
            }},6200)
        })

        
    
    })

    socket.on('capnhattienmoi',(guidi)=>{
        const userModel = require('./model/userModel');
        const roomUserModel = require('./model/roomUser');

        userModel.findOneAndUpdate({nickname: guidi.nickname},{
            tongxu: guidi.tongxu
        },{new:true}).then(()=>{})

        roomUserModel.findOneAndUpdate({nickname: guidi.nickname},{
            tongxu: guidi.tongxu
        },{new:true}).then(()=>{})
    })
  

    //Hàm khởi tạo cặp 3 số ngẫu nhiên
    const arrayNumber = [[1,4,3],[6,3,4],[2,6,2],[3,4,5],[2,6,1],[3,4,1],[1,1,2],[2,5,4],[5,1,2],[1,3,1],[5,4,5],[1,4,6],[1,6,5],[4,3,6],[4,2,1],[3,2,4],[6,5,3],[4,3,4],[6,4,4],[2,3,2],[5,4,2],[3,3,4],[3,4,5],[1,6,3],[4,5,4],[3,6,4],[5,2,4],[1,4,2],[2,1,5],[2,6,5],[3,4,6],[4,4,3],[1,6,6],[5,4,2],[4,4,2],[4,1,1],[3,1,2],[3,5,2],[2,2,2],[6,1,3],[6,5,3],[6,1,4],[4,4,3],[5,3,2],[6,2,5],[6,1,6],[1,4,5],[2,6,5],[1,3,4],[3,4,4],[4,3,6],[5,2,4],[3,1,2],[6,3,5],[5,5,4],[1,3,6],[5,2,4],[1,3,1],[3,5,1],[5,3,1],[2,4,1],[3,3,5],[6,1,1],[2,6,6],[4,5,2],[6,2,1],[4,5,1],[5,2,3],[1,2,5],[3,1,4],[3,4,6],[4,5,5],[2,4,5],[6,5,3],[4,3,6],[1,6,3],[5,1,5],[1,1,2],[2,3,1],[1,6,4],[4,2,3],[1,3,4],[6,6,4],[2,4,4],[3,4,3],[4,5,4],[2,5,2],[3,1,1],[4,1,6],[1,6,4],[2,6,1],[5,5,4],[5,5,6],[3,3,5],[4,3,6],[3,1,1],[3,2,2],[4,5,5],[2,3,4],[2,6,2],[6,1,4],[5,2,6],[5,5,5],[6,4,2],[1,2,4],[6,3,4],[5,3,5],[1,5,1],[4,5,4],[5,2,2],[5,6,6],[5,2,1],[3,6,1],[1,5,5],[6,2,1],[3,4,3],[4,4,6],[2,5,2],[4,2,2],[1,1,2],[2,3,4],[3,3,5],[3,2,1],[5,5,5],[3,2,5],[1,4,4],[4,4,1],[2,5,4],[6,4,3],[1,4,3],[6,1,5],[3,5,3],[3,6,2],[5,5,3],[1,1,1],[6,1,1],[3,5,5],[1,5,1],[5,6,3],[1,4,6],[2,1,3],[5,3,5],[6,5,5],[5,3,5],[6,6,2],[4,6,3],[6,4,6],[6,1,5],[3,1,3],[4,5,2],[4,1,3],[1,4,2],[6,3,4],[4,6,1],[6,1,4],[6,6,4],[6,5,3],[5,5,3],[5,6,6],[6,2,1],[6,6,4],[1,5,2],[4,6,4],[3,6,5],[3,6,4],[5,1,3],[6,4,2],[5,5,2],[3,4,4],[1,5,2],[4,3,1],[6,3,4],[1,3,5],[1,4,6],[6,4,6],[2,3,4],[6,5,6],[4,4,5],[6,1,1],[4,1,2],[4,2,2],[2,3,4],[4,1,2],[3,4,4],[5,3,6],[3,4,2],[3,3,2],[6,1,1],[6,4,5],[1,2,4],[1,5,2],[1,2,1],[5,2,5],[3,3,2],[5,2,3],[5,2,2],[6,1,1],[4,1,5],[3,5,2],[5,1,3],[3,1,5],[1,5,1],[5,1,2],[3,1,2],[6,2,5],[4,2,4],[1,4,2],[3,2,3],[2,3,4],[2,3,1],[5,2,6],[4,6,2],[6,1,2],[6,6,5],[5,3,4],[6,4,6]]


    function danhtinhmoi(NumberA){
        let nameBauCua = ''
        if(NumberA == '1'){
            nameBauCua = 'nai'
        }else if(NumberA == '2'){
            nameBauCua = 'bau'
        }else if(NumberA == '3'){
            nameBauCua = 'ga'
        }else if(NumberA == '4'){
            nameBauCua = 'ca'
        }else if(NumberA == '5'){
            nameBauCua = 'cua'
        }else if(NumberA == '6'){
            nameBauCua = 'tom'
        }
        return nameBauCua;
    }


    socket.on('endgame',()=>{
        io.emit('endgamepro')
    })

    //Khi Admin nhấn vào bắt đầu lại màn chơi
    socket.on('action2',()=>{
        io.emit('action2FromAdmin')
        const showCoinModel = require('./model/showcoin');
        showCoinModel.findOneAndUpdate({id:'saveimg'},
            {nai: 0,
            bau:0,
            ga:0,
            ca:0,
            cua:0,
            tom:0
        },{new:true}).then(()=>{})
        openRoom = 'true'
    })

    //Nhận hành động sửa lỗi
    socket.on('fixed',()=>{
        //Xử lí lỗi nạp tiền
        const handlebuycard = require('./model/handlebuycard');
        handlebuycard.findOneAndRemove({}).then()

        //Xử lí lỗi người chơi trong phòng (reset)
        const roomuser = require('./model/roomUser');
        roomuser.findOneAndRemove({}).then()
        roomuser.deleteMany()


        const showCoinModel = require('./model/showcoin');
        showCoinModel.findOneAndUpdate({id:'saveimg'},
            {nai: 0,
            bau:0,
            ga:0,
            ca:0,
            cua:0,
            tom:0
        },{new:true}).then(()=>{})

    })

    //Nhận giá trị từ client
    socket.on('xudat',(xudat)=>{
        let name = xudat.name;
        let countXu = xudat.count_xu;

        var bien_nai =0;
        var bien_bau =0;
        var bien_ga =0;
        var bien_ca =0;
        var bien_cua =0;
        var bien_tom =0;

        showCoinModel.findOne().then((data)=>{
            switch(name){
                case 'nai':
                    bien_nai = parseInt(data.nai) + parseInt(countXu)
                    showCoinModel.findOneAndUpdate({id:'saveimg'},{nai: bien_nai},{new:true}).then((data))
                    
                    break;
                case 'bau':
                    bien_bau = parseInt(data.bau) + parseInt(countXu)
                    showCoinModel.findOneAndUpdate({id:'saveimg'},{bau: bien_bau},{new:true}).then((data))
                    break;
                case 'ga':
                    bien_ga = parseInt(data.ga)+ parseInt(countXu)
                    showCoinModel.findOneAndUpdate({id:'saveimg'},{ga: bien_ga},{new:true}).then((data))
                    break;
                case 'ca':
                    bien_ca = parseInt(data.ca)+ parseInt(countXu)
                    showCoinModel.findOneAndUpdate({id:'saveimg'},{ca: bien_ca},{new:true}).then((data))
                    break;
                case 'cua':
                    bien_cua = parseInt(data.cua) + parseInt(countXu)
                    showCoinModel.findOneAndUpdate({id:'saveimg'},{cua: bien_cua},{new:true}).then((data))
                    break;
                case 'tom':
                    bien_tom = parseInt(data.tom) + parseInt(countXu)
                    showCoinModel.findOneAndUpdate({id:'saveimg'},{tom: bien_tom},{new:true}).then((data))
                    break;
            }
            // showCoinModel.findOneAndUpdate({id:'saveimg'},{
            //     nai:bien_nai,
            //     bau:bien_bau,
            //     ga:bien_ga,
            //     ca:bien_ca,
            //     cua:bien_tom,
            //     tom:bien_cua
            // },{new:true}).then((data)=>console.log(data))


        })
        showXuDatRoomSocket();
      
    })


    function showXuDatRoomSocket(){
        showCoinModel.find().then((data)=>{
            io.emit('showXuDatRoomSocket', data)
        })
    }

    //Hàm tạo element 
    //Khi có người mới vào phòng sẽ tạo ra các element hiển thị trên giao diện bàn chơi
    function createElementUser(){
        roomUserModel.find().then((data)=>{
            io.emit('createElementUser', data)
        })
    }


    //Đếm số người chơi trong phòng
    function countNumberUser(){
        roomUserModel.count({}, function( err, count){
            io.emit('countNumberUser', count)
        })
    }

    //Hàm lặp lại hành động tạo phần tử sau 900 milisecond
    setInterval(()=>{
        createElementUser();
        countNumberUser();
       
    },1100)

    // setInterval(()=>{
    //     showXuDatRoomSocket();
    // },3500)


    //Khi bấm vào nút xem người chơi trong phòng
    socket.on('showuserinRoom',()=>{
        const roomUserModel = require('./model/roomUser');
        roomUserModel.find().then((data)=>{
            socket.emit('showuserinRoomClient', data)
        })
    })


    //Xử lí chỉ nhận 1 người mua vé
    socket.on('userbuycard',(data)=>{
        let socketid = data;
        const handlebuycard = require('./model/handlebuycard');

        handlebuycard.count({}, function( err, count){
            if(count > 0){
                socket.emit('waitingUser', 'fullUser')
            }else{
                handlebuycard.create({
                    socket_id : socketid
                })
            }
        })
    })

    socket.on('outbuycard',()=>{
        userCount --;
        console.log(userCount)
    })

    // socket.on('userbuy_card',(data)=>{
    //     if(data == 2){
    //         socket.emit('waitingUser', 'fullUser')
    //     }else{
    //         userbuycard ++;
    //     }
    // })


    socket.on('userOnline', (data)=>{
        socket.broadcast.emit('userOnline', data)
    })

    socket.on('userruttien', (data)=>{
        socket.broadcast.emit('userruttien', data)
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



    //Xác nhận rút tiền từ Admin
    socket.on('accept_ruttien', (data)=>{
        const userModel = require('./model/userModel');
        const nickname = data.nickname;
        const sotienrut = data.sotienrut;
        const tongxu_update = 0;

        //Cập nhật lại tiền
        userModel.findOneAndUpdate({nickname: nickname}, {tongxu: tongxu_update},{new: true})
        .then(()=>{
            socket.broadcast.emit("accept_ruttien", "xacnhan")
        })

        var date = new Date();
        var current_date = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+ date.getDate();
        var current_time = date.getHours()+":"+date.getMinutes()+":"+ date.getSeconds();
        var date_time = current_date+" "+current_time;	
        
        const buyCardModel = require('./model/ruttien');
        buyCardModel.create({
            tennguoichoi: nickname,
            sotienrut: sotienrut,
            thoigian: date_time
        })
    })


    //Khi từ chốirút tiền từ admin
    socket.on('deny_ruttien', (data)=>{
        socket.broadcast.emit("deny_ruttien", "xacnhan")    
    })

     //Khi từ chối nạp tiền từ admin
    socket.on('deny_buy_card', (data)=>{
        socket.broadcast.emit("deny_buy_card", "xacnhan")    
    })
    
    socket.on('disconnect', () => {
        const roomUserModel = require('./model/roomUser');
        const handlebuycard = require('./model/handlebuycard');

        handlebuycard.findOneAndRemove({socket_id: socket.id},
            function (err, docs) {
            if (err){
                console.log(err)
            }
            else{
                console.log(docs);
            }
        })

        roomUserModel.findOne({socketID: socket.id}).then((data)=>{ 
            io.emit('user disconnected',data)});

        setTimeout(()=>{
            roomUserModel.findOneAndRemove({socketID: socket.id},
                function (err, docs) {
                if (err){
                    console.log(err)
                }
                else{
                    console.log(docs);
                }
            })
    
        },1000)
   
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


app.get('*',(req, res)=>{
    res.redirect('/404_page')
})
server.listen(PORT, ()=>{
    console.log(`Ket noi thanh cong server voi cong port = ${PORT}`)
})

