let express = require("express");
let Router = express.Router();
let sqlModule = require("../MySQL/sqlModule");
let formable = require("formidable");
let fs = require("fs");
let multer = require("multer");
let moment = require("moment");
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "Static/upload/banner")
    },
    filename: function (req, file, cb) {
        //后缀名
        let zh = "";
        switch (file.mimetype) {
            case "image/png": zh = ".png"; break;
            case "image/jpeg": zh = ".jpg"; break;
        }
        cb(null, file.fieldname + "-" + Date.now() + zh);
    }
});
let upload = multer({ storage: storage });
//上传视频
let storagevideo = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "Static/upload/radio")
    },
    filename: function (req, file, cb) {
        //后缀名
        let extName = file.originalname.slice(file.originalname.lastIndexOf('.'))
        cb(null, Date.now() + extName);
    }
});

Router.all("*", (req, res, next) => {
    //读取logo
    let fun = async () => {
        let logoinfo = await sqlModule.findlogo();
        return {
            logoinfo
        }
    }
    //读取用户的信息
    let user = req.signedCookies.ADMINUSER;
    if (user) {
        user = JSON.parse(user);
    }
    fun().then((result) => {
        res.locals.adminlogo = result.logoinfo[0];
        res.locals.adminuser = user;
        next();
    });

})
Router.get("/", (req, res) => {
    //获取记录的email，pwd
    let userdata = req.signedCookies.ADMIN;
    if (userdata) {
        userdata = JSON.parse(userdata);
    }
    let login = req.query.login;
    res.render("admin/index.html", {
        login: login,
        userdata: userdata
    }, (err, html) => {
        if (err) {
            throw err;
        }
        res.send(html);
    });
});
Router.get("/adminSytem", (req, res) => {

    res.render("admin/admin.html", {
        logo: res.locals.adminlogo,
        user: res.locals.adminuser
    }, (err, html) => {
        if (err) {
            throw err;
        }
        res.send(html);
    });
});
//登录
Router.post("/userlogin", (req, res) => {
    let email = req.body.email;
    let pwd = req.body.pwd;
    let on = req.body.rember;
    //写入缓存
    if (on) {
        let json = { email: email, pwd: pwd };
        res.cookie("ADMIN", JSON.stringify(json), {
            path: "/admin",
            signed: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    }
    sqlModule.userlogin(email, pwd).then((result) => {
        if (result[0].count == 1) {
            //已邮箱创建用户文件
            let path = `Static/upload/user/${email}`;
            fs.mkdir(path, (err) => {
                if (err) {
                    console.log("创建失败！");
                }
                else {
                    console.log("创建成功！");
                    fs.mkdirSync(path + "/image");
                    fs.mkdirSync(path + "/blog");
                    fs.mkdirSync(path + "/video");
                }
            });
            //获取用户的信息
            sqlModule.finduserinfo(email).then((userinfo) => {
                res.cookie("ADMINUSER", JSON.stringify(userinfo[0]), {
                    path: "/admin",
                    signed: true,
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });
                res.redirect("/admin/adminSytem");
            });
        }
        else {
            res.redirect("./?login=no");
        }
    });
});
//退出
Router.get("/amdinclose", (req, res) => {
    res.clearCookie("ADMINUSER", {
        path: "/admin",
        signed: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.redirect("/admin");
});
//我的资料
Router.get("/myinfo", (req, res) => {
    res.render("admin/myinfo.html", {
        user: res.locals.adminuser
    }, (err, html) => {
        if (err) {
            throw err;
        }
        res.send(html);
    });
});
//表单提交+上传图片
Router.post("/updatemyinfo", (req, res) => {
    let form = new formable.IncomingForm();
    //设置编辑
    form.encoding = 'utf-8';
    //设置上传目录
    form.uploadDir = `Static/upload/user/${res.locals.adminuser.email}/image`;
    //保留后缀
    form.keepExtensions = true;
    let host = "http://localhost:8000";
    form.parse(req, (err, fileds, files) => {
        //  fileds  数据
        //files  图片路径
        let id = res.locals.adminuser.id;
        let name = fileds.name;
        let sex = fileds.sex;
        let age = fileds.age;
        let address = fileds.address;
        let job = fileds.job;
        let email = fileds.email;
        let pwd = fileds.pwd;
        let detail = fileds.detail;
        let face = host + files.face.path.replace("Static", "").replace(/\\/g, "/");
        let photo = host + files.photo.path.replace("Static", "").replace(/\\/g, "/");
        sqlModule.updateuser(name, sex, age, address, photo, detail, job, face, email, pwd, id).then((result) => {
            if (result.affectedRows == 1) {
                sqlModule.finduserinfo(email).then((userinfo) => {
                    res.cookie("ADMINUSER", JSON.stringify(userinfo[0]), {
                        path: "/admin",
                        signed: true,
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    });
                    res.send(userinfo);
                });
            }
            else {
                //失败
                res.send("error");
            }

        });
    });
})


//设置轮播路由
Router.get("/setbanner", (req, res) => {
    res.render("admin/setbanner.html", (err, html) => {
        if (err) {
            throw err;
        }
        res.send(html);
    });
});
//上传banner
Router.post("/uploadbanner", upload.array("image", 5), (req, res) => {
    let host = "http://localhost:8000";
    let src1 = host + req.files[0].path.replace("Static", "").replace(/\\/g, "/");
    let src2 = host + req.files[1].path.replace("Static", "").replace(/\\/g, "/");
    let src3 = host + req.files[2].path.replace("Static", "").replace(/\\/g, "/");
    let src4 = host + req.files[3].path.replace("Static", "").replace(/\\/g, "/");
    let src5 = host + req.files[4].path.replace("Static", "").replace(/\\/g, "/");
    let fun = async () => {
        let a1 = await sqlModule.insertbanner(src1);
        let a2 = await sqlModule.insertbanner(src2);
        let a3 = await sqlModule.insertbanner(src3);
        let a4 = await sqlModule.insertbanner(src4);
        let a5 = await sqlModule.insertbanner(src5);
        return {
            a1, a2, a3, a4, a5
        }
    }
    fun().then((result) => {
        res.send("success");
    });
});

//设置logo路由
Router.get("/setlogo", (req, res) => {
    res.render("admin/setlogo.html", (err, html) => {
        if (err) {
            throw err;
        }
        res.send(html);
    });
});
//上传logo
Router.post("/uploadlogo", (req, res) => {
    let formparser = new formable.IncomingForm();
    formparser.encoding = "utf-8";
    formparser.uploadDir = "Static/upload/logo";
    //保留后缀
    formparser.keepExtensions = true;
    let host = "http://localhost:8000";
    formparser.parse(req, (err, fileds, files) => {
        let conetent = fileds.are;
        let logo = host + files.logo.path.replace("Static", "").replace(/\\/g, "/");
        sqlModule.updatelogo(conetent, logo).then((result) => {
            console.log(result);
            if (result.affectedRows == 1) {
                res.send("success");
            }
            else {
                res.send("error");
            }
        });
    });
});
//设置菜单路由
Router.get("/setmenu", (req, res) => {
    sqlModule.findTitle().then((result) => {
        res.render("admin/setmenu.html", {
            menu: result
        }, (err, html) => {
            if (err) {
                throw err;
            }
            res.send(html);
        });
    });
});
//修改菜单的接口
Router.post("/updatetitle", (req, res) => {
    let id = req.body.id;
    let name = req.body.name;
    let status = req.body.ck;
    sqlModule.updatemenu(id, name, status).then((result) => {
        if (result.affectedRows == 1) {
            res.send("success");
        }
        else {
            res.send("error");
        }
    });
});
//上传博客路由
Router.get("/uploadblog", (req, res) => {
    sqlModule.findblogType().then((result) => {
        res.render("admin/uploadblog.html", {
            type: result
        }, (err, html) => {
            if (err) {
                throw err;
            }
            res.send(html);
        });
    });
});
//博客文章上图片上传
Router.post("/uploadimage", (req, res) => {
    let formparser = new formable.IncomingForm();
    formparser.encoding = "utf-8";
    formparser.uploadDir = "Static/upload/blogimage";
    //保留后缀
    formparser.keepExtensions = true;
    let host = "http://localhost:8000";
    formparser.parse(req, (err, fileds, files) => {
        let logo = host + files.img.path.replace("Static", "").replace(/\\/g, "/");
        res.send(logo);
    });
});
//上传博客的接口
Router.post("/uploadblog", (req, res) => {
    let formparser = new formable.IncomingForm();
    formparser.encoding = "utf-8";
    formparser.uploadDir = "Static/upload/blogimage";
    //保留后缀
    formparser.keepExtensions = true;
    let host = "http://localhost:8000";
    formparser.parse(req, (err, fileds, files) => {
        let name = fileds.name;
        let type = fileds.type;
        let detail = fileds.detail;
        let content = fileds.conetent;
        let face = host + files.face.path.replace("Static", "").replace(/\\/g, "/");
        let time = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
        sqlModule.insertblog(name, type, detail, content, face, time).then((result) => {
            if (result.affectedRows == 1) {
                res.send("success");
            }
            else {
                res.send("error");
            }
        });

    });
});
//上传视频路由
Router.get("/uploadvideo", (req, res) => {
    res.render("admin/uploadvideo.html", (err, html) => {
        if (err) {
            throw err;
        }
        res.send(html);
    });
});
//上传视频的接口
Router.post("/uploadvideo", (req, res) => {
    let uploadvideo = multer(storagevideo).any();
    let host = "http://localhost:8000";
    uploadvideo(req, res, (err) => {
        if (err) {
            throw err;
        }
        let file = req.files[0];
        fs.writeFile(`Static/upload/radio/${file.originalname}`, file.buffer, (err) => {
            if (err) {
                res.send("error");
                return;
            }
            console.log(host + "/upload/radio/" + file.originalname);
            //写入成功之后将视频地址存储到服务器
            let name = file.originalname.substring(0, file.originalname.indexOf("."));
            let url = host + "/upload/radio/" + file.originalname;
            let number = file.originalname.substring(file.originalname.indexOf(".") + 3, file.originalname.indexOf(".") + 4);
            sqlModule.insertVideo(name, url, number).then((result) => {
                if (result.affectedRows == 1) {
                    res.send("success");
                }
                else {
                    res.send("error");
                }
            });
        });

    });
});
//设置视频
Router.get("/setvideo", (req, res) => {
    let fun=async ()=>{
        let info=await sqlModule.selectvideo();
        let type=await sqlModule.findvidetype();
        return{
            info,type
        }
    }
    fun().then((result)=>{
        res.render("admin/setvideo.html", {
            list:result.info,
            type:result.type
        },(err, html) => {
            if (err) {
                throw err;
            }
            res.send(html);
        });
    });
});
//根据id获取视频信息
Router.post("/getvideoinfo",(req,res)=>{
    let id=req.body.id;
    sqlModule.findvideoinfo(id).then((result)=>{
        res.send(result[0]);
    });
});
//根据id修改视频信息
Router.post("/updatevideoinfo",(req,res)=>{
    let id=req.body.id;
    let detail=req.body.detail;
    let isfree=req.body.isfree;
    let price=req.body.price;
    let type=req.body.type;
    let jibie=req.body.jibie;
    let islook=req.body.islook;
    sqlModule.updatevideo(detail,price,isfree,type,jibie,islook,id).then((result)=>{
        if(result.affectedRows==1)
        {
            res.send("success");
        }
        else{
            res.send("error");
        }
    });
});
//回复留言路由
Router.get("/sendmessage", (req, res) => {
    res.render("admin/sendmessage.html", (err, html) => {
        if (err) {
            throw err;
        }
        res.send(html);
    });
});
//用户管理路由
Router.get("/setuser", (req, res) => {
    res.render("admin/setuser.html", (err, html) => {
        if (err) {
            throw err;
        }
        res.send(html);
    });
});
module.exports = Router;