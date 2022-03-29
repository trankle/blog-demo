//首页路由
let express = require("express");
let fs = require("fs");
let sqlmodule = require("../MySQL/sqlModule");
let Router = express.Router();
Router.all("*", (req, res, next) => {
    // 获取网站的导航
    //logo
    let fun = async () => {
        let navTitle = await sqlmodule.findTitle();
        let logo = await sqlmodule.findlogo();
        let user = await sqlmodule.finduser();
        return {
            navTitle,
            logo,
            user
        }
    }
    fun().then((result) => {
        res.locals.navTitle = result.navTitle;
        res.locals.logo = result.logo[0];
        res.locals.user = result.user;

        //获取用户登录的信息
        if(req.signedCookies.USERLOGIN){
            res.locals.userinfo=JSON.parse(req.signedCookies.USERLOGIN)
        }
        else{
            res.locals.userinfo=null;
        }
        //检测记住我的账号密码
        if(req.signedCookies.USER_INFO)
        {
            res.locals.USER_INFO=JSON.parse(req.signedCookies.USER_INFO);   
        }
        
        next();
    }).catch((error) => {
        //如果有错误  直接到错误中间件
        next(error);
    });
});
Router.get("/", (req, res, next) => {
    // 首页里面写请求
    let fun = async () => {
        let banner = await sqlmodule.findBanner();
        let newblog = await sqlmodule.findNewBlog();
        let blogKa = await sqlmodule.findTypeBlog()();
        let bloglist = await sqlmodule.findnewBloglist();
        let numberblog = await sqlmodule.clickNumberBlog();
        let comment = await sqlmodule.commentblog();
        let newsblog = await sqlmodule.newsblog(5);
        return {
            bannerlist: banner,
            newblog,
            blogKa,
            bloglist,
            numberblog,
            comment,
            newsblog
        }
    }
    fun().then((result) => {
        //获取路径的传值
        res.render("index", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: 0,
            bannerinfo: result.bannerlist,
            logo: res.locals.logo,
            newblog: result.newblog[0],
            blogKaData: result.blogKa,
            bloglist: result.bloglist,
            blogNumber: result.numberblog,
            comment: result.comment,
            newsblog: result.newsblog,
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((err) => {
        next(err);
    });
});
// 进入视频路由  默认 免费  全部
Router.get("/radio", (req, res, next) => {
    //接收路劲的参数
    let tid = req.query.tid ? req.query.tid : 0;
    let cid = req.query.cid ? req.query.cid : 0;
    //分页
    let page = req.query.page ? req.query.page : 1;
    let pagenumber = 8;
    let fun = async () => {
        let radiolist = await sqlmodule.findradiopage(page, pagenumber, tid, cid);
        let radiocount = await sqlmodule.findCountRadio(tid, cid);
        return {
            radiolist,
            radiocount
        }
    }
    fun().then((result) => {
        res.render("radio", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: 1,
            tid: tid,
            cid: cid,
            radiolist: result.radiolist,
            count: Math.ceil(result.radiocount[0].count / pagenumber),
            nowpage: page,
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((error) => {
        next(error);
    });
});
//观看视频的
Router.get("/radioweb", (req, res, next) => {
    //接收视频的id
    let id = req.query.id;
    let fun = async () => {
        let info = await sqlmodule.findvideoinfo(id);
        let newsblog = await sqlmodule.newsblog(8);
        //查找同类的初级和高级视频
        let videolisttype = await sqlmodule.findvideotype(info[0].type);
        return {
            info,
            newsblog,
            videolisttype
        }
    }
    fun().then((result) => {
        res.render("childpage/radioWeb.html", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: null,
            info: result.info[0],
            news: result.newsblog,
            videolist: result.videolisttype,
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((error) => {
        next(error);
    });

});
// 写一个ajax接口
Router.post("/getvideocomment", (req, res) => {
    sqlmodule.findvideoComment(req.body.id, req.body.way).then((result) => {
        res.send(result);
    });
});
//修改赞
Router.post("/updatezan", (req, res) => {
    sqlmodule.updateZan(req.body.id, req.body.zan, req.body.tab).then((result) => {
        res.send(result);
    });
});

Router.get("/complate", (req, res, next) => {
    let fun = async () => {
        let newsblog = await sqlmodule.newsblog(5);
        let bloglist = await sqlmodule.findComplate();
        return {
            newsblog,
            bloglist
        }
    }
    fun().then((result) => {
        res.render("complate", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: 2,
            newsblog: result.newsblog,
            bloglist: result.bloglist,
            map: null,
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((error) => {
        next(error)
    });
}).get("/complate/:id", (req, res, next) => {
    let obj = { one: [5, "个人博客模板"], two: [6, "企业系统模板"], three: [7, "管理系统模板"] }
    let fun = async () => {
        let newsblog = await sqlmodule.newsblog(5);
        let bloglist = await sqlmodule.findComplateone(obj[req.params.id][0]);
        return {
            newsblog,
            bloglist
        }
    }
    fun().then((result) => {
        res.render("complate", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: 2,
            newsblog: result.newsblog,
            bloglist: result.bloglist,
            map: obj[req.params.id][1],
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((error) => {
        next(error)
    });
});
Router.get("/blog", (req, res, next) => {
    let fun = async () => {
        let newsblog = await sqlmodule.newsblog(5);
        let bloglist = await sqlmodule.findblog();
        return {
            newsblog,
            bloglist
        }
    }
    fun().then((result) => {
        res.render("blog", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: 3,
            newsblog: result.newsblog,
            bloglist: result.bloglist,
            map: null,
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((error) => {
        next(error)
    });
}).get("/blog/:id", (req, res, next) => {
    let obj = { one: [1, "web前端"], two: [2, "程序人生"], three: [3, "学无止境"], four: [4, "建站必知"] }
    let fun = async () => {
        let newsblog = await sqlmodule.newsblog(5);
        let bloglist = await sqlmodule.findblogeone(obj[req.params.id][0]);
        return {
            newsblog,
            bloglist
        }
    }
    fun().then((result) => {
        res.render("blog", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: 2,
            newsblog: result.newsblog,
            bloglist: result.bloglist,
            map: obj[req.params.id][1],
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((error) => {
        next(error)
    });
});
Router.get("/diary", (req, res) => {
    res.render("diary", {
        topNav: res.locals.navTitle,
        user: res.locals.user[0],
        index: 4,
        useryesorno:req.query.userlogin,
        userinfo:res.locals.userinfo,
        defaultinfo:res.locals.USER_INFO
    }, (err, html) => {
        res.send(html);
    });
});
//ajax接口  获取时间轴的数据
Router.post("/getlist", (req, res) => {
    sqlmodule.findlist(req.body.nowpage, req.body.pagenum).then((result) => {
        res.send(result);
    });
});
Router.get("/author", (req, res, next) => {
    let fun = async () => {
        let userinfo = await sqlmodule.finduser();
        return {
            userinfo
        }
    }
    fun().then((result) => {
        res.render("author", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: 5,
            userinfo: result.userinfo[0],
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((error) => {
        next(error);
    });
});
Router.get("/message", (req, res, next) => {
    let fun = async () => {
        let numberblog = await sqlmodule.clickNumberBlog();
        return {
            numberblog
        }
    }
    fun().then((result) => {
        res.render("message", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: 6,
            blogNumber: result.numberblog,
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            res.send(html);
        });
    }).catch((error) => {
        next(error)
    });

});
// 写一个ajax接口
Router.post("/getmessage", (req, res) => {
    sqlmodule.findmessage(req.body.way).then((result) => {
        res.send(result);
    });
});
//修改赞
Router.post("/updatemessagezan", (req, res) => {
    sqlmodule.updatemessZan(req.body.id, req.body.zan, req.body.tab).then((result) => {
        res.send(result);
    });
});



// 首页表单提交  搜索
Router.get("/searchinfo", (req, res, next) => {
    //将值返回到服务器  获取模糊查找
    let fun = async () => {
        let bloglist = await sqlmodule.mohuSelect(req.query.search);
        return {
            bloglist
        }
    }
    fun().then((result) => {
        res.render("childpage/search.html", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: null,
            logo: res.locals.logo,
            bloglist: result.bloglist, //检测数据是空  处理界面
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            if (err) {
                throw err;
            }
            res.send(html);
        });
    }).catch((error) => {
        next(error);
    });

});
//博客的详细界面
Router.get("/detail", (req, res, next) => {
    let fun = async () => {
        let newsblog = await sqlmodule.newsblog(5);
        let findblog = await sqlmodule.findblogData(req.query.id);
        let upblog = await sqlmodule.findup(req.query.id);
        let downblog = await sqlmodule.finddown(req.query.id);
        let newsbloginfo = await sqlmodule.newsblog(8);
        return {
            newsblog,
            findblog,
            upblog,
            downblog,
            newsbloginfo
        }
    }
    fun().then((result) => {
        res.render("childpage/blogdetail.html", {
            topNav: res.locals.navTitle,
            user: res.locals.user[0],
            index: req.query.ck,
            logo: res.locals.logo,
            newsblog: result.newsblog,
            bloginfo: result.findblog[0],
            upbloginfo: result.upblog[0],
            downbloginfo: result.downblog[0],
            news: result.newsbloginfo,
            useryesorno:req.query.userlogin,
            userinfo:res.locals.userinfo,
            defaultinfo:res.locals.USER_INFO
        }, (err, html) => {
            if (err) {
                throw err;
            }
            res.send(html);
        });
    }).catch((error) => {
        next(error)
    });
});
//查博客的评论
Router.post("/getblogcomment", (req, res) => {
    let id = req.body.id;
    sqlmodule.findblogcomment(id, req.body.way).then((result) => {
        res.send(result);
    });
});
//修改博客的赞
Router.post("/updateblogzan", (req, res) => {
    sqlmodule.updateblogZan(req.body.id, req.body.zan, req.body.tab).then((result) => {
        res.send(result);
    });
});
//用户登录
Router.post("/userlogin", (req, res) => {
    //cookie-parser
    let email = req.body.email;
    let pwd = req.body.pwd;
    let on = req.body.rember;
    if (on) {
        let user = { email: email, pwd: pwd };
        //写入缓存
        res.cookie("USER_INFO", JSON.stringify(user), {
            signed: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,//7天有效期
            path: "/"
        });
    }
    //访问服务器
    sqlmodule.userlogin(email, pwd).then((result) => {
        if (result[0].count == 1) {
            //获取用户的信息
            sqlmodule.finduserinfo(email).then((user) => {
                //存储user
                //用户信息写入缓存
                res.cookie("USERLOGIN",JSON.stringify(user[0]),{
                    maxAge:7*24*60*60*1000,
                    path:"/",
                    signed:true
                });
                //回到当前页面的上一级页面
                res.redirect("./?userlogin=yes");
            });
        }
        else {
            //回到当前页面的上一级页面
            res.redirect("./?userlogin=no");
        }
    });
});
Router.get("/userclose",(req,res)=>{
    //退出
    res.clearCookie("USERLOGIN",{
        maxAge:7*24*60*60*1000,
        path:"/",
        signed:true
    });
    res.redirect("./");
});
//发表留言
let moment=require("moment")
Router.post("/sendmessage",(req,res)=>{
        let time=moment(req.body.time).format("YYYY-MM-DD HH:mm:ss");
        sqlmodule.insertmsg(req.body.id,req.body.txt,time,0).then((result)=>{
            res.send(result);
        });
});
module.exports = Router;