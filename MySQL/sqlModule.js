let mysqlmodule = require("./mySQLModule");
let moduleData = (sql) => {
    //使用promise
    return new Promise((resolve, reject) => {
        try {
            mysqlmodule.findData(sql, (data) => {
                resolve(data);
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
module.exports = {
    //查找网站导航的方法
    findTitle() {
        let sql = "select * from navTitle";
        return moduleData(sql);
    },
    //查找banner
    findBanner() {
        let sql = "select * from banner order by id desc limit 5";
        return moduleData(sql);
    },
    // 获取logo and  每日一语
    findlogo() {
        let sql = "select * from logo";
        return moduleData(sql);
    },
    //找最新的博客
    findNewBlog() {
        let sql = "select * from userblog order by gotime desc limit 1";
        return moduleData(sql);
    },
    // 选项卡  按类别分  找最新
    findTypeBlog() {
        let sqltype = "select * from blogType where typeid=1"
        //let sql = "select userblog.name,detail,blogface,blogType.type,gotime from userblog,blogType where userblog.type=blogType.id order by gotime desc ";
        //  根据类别 获取每个类别下前8个数据
        let sql = "select userblog.id,userblog.name,detail,blogface,blogType.type,gotime from userblog,blogType where userblog.type=blogType.id and userblog.id in (select a.id from userblog as a,(select group_concat(id order by type asc) as ids from userblog group by type) as b where find_in_set(a.id,b.ids) between 1 and 8) order by gotime desc"
        let fun = async () => {
            let blogType = await moduleData(sqltype);
            let json = await ((type) => {
                return new Promise((resolve, reject) => {
                    moduleData(sql).then((res) => {
                        //合并表
                        for (let i = 0; i < res.length; i++) {
                            type.map((val, index) => {
                                if (!val.blog) {
                                    val.blog = [];
                                }
                                if (val.type == res[i].type) {
                                    val.blog.push(res[i]);
                                }
                            });
                        }
                        resolve(type);
                    });
                });
            })(blogType);
            return json;
        }
        return fun;
    },
    findnewBloglist() {
        //首页  博客列表
        let sql = "select user.name as username,user.face,b.id as blogid,b.name,b.detail,blogface,type,gotime from (select userblog.id,userblog.userid,userblog.name,userblog.detail,blogface,blogType.type,gotime from userblog,blogType where userblog.type=blogType.id order by gotime desc limit 10) as b,user where b.userid=user.id";
        return moduleData(sql);
    },
    mohuSelect(search) {
        // 模糊查找 
        let sql = `select user.name as username,user.face,b.name,b.detail,blogface,type,gotime from (select userblog.userid,userblog.name,userblog.detail,blogface,blogType.type,gotime from userblog,blogType  where userblog.type=blogType.id and userblog.name like '%${search}%' order by gotime desc limit 10) as b,user where b.userid=user.id`;
        return moduleData(sql);
    },
    clickNumberBlog() {
        // 点击排行
        let sql = "select id,name from userblog order by number desc limit 6";
        return moduleData(sql);
    },
    commentblog() {
        //博客评论
        let sql = "select user.id,name,face,blogid,content,ctime from comment left join user on user.id=comment.userid order by ctime desc";
        return moduleData(sql);
    },
    newsblog(num) {
        // 最新博客
        let sql = `select id,name,gotime,blogface from userblog order by gotime desc limit ${num}`;
        return moduleData(sql);
    },
    findradiopage(page, number, tid, cid) {
        //tid  参数是否收费   cid  参数  类别
        //查找视频的分页
        let startnum = (page - 1) * number;
        let sql = `select * from (select id,name,detail,look,price,isfree,group_concat(jibie,number) as jnum,type from radio group by name order by jnum) as b where isfree=${tid} ${cid != 0 ? `and type=${cid}` : ''} limit ${startnum},${number}`;
        return moduleData(sql);
    },
    findCountRadio(tid, cid) {
        //计算总页码
        let sql = `select count(*) as count from radio where isfree=${tid} ${cid != 0 ? `and type=${cid}` : ''}`;
        return moduleData(sql);
    },
    findvideoinfo(id) {
        //根据id查
        let sql = `select radio.id,radio.name,radio.url,radio.type,radiotype.radiotype,radio.jibie,radio.islook,radio.isfree from radio left join radiotype on radiotype.id=radio.type where radio.id=${id}`;
        return moduleData(sql);
    },
    findvideoComment(id, way) {
        //根据id找视频的评论
        let sql = `select videocomment.id as cid,videocomment.content,videocomment.ctime,videocomment.zan,user.name,user.face  from videocomment left join user on videocomment.userid=user.id  where videoid=${id} ${way ? `order by ${way} desc` : ''}`;
        //return moduleData(sql);
        // 根据当前的视频id找该视频评论是否有回复
        let sqlfind = `select sendvideocomment.id as sid,vcid,videoid,content,vtime,vzan,user.name,user.face from sendvideocomment,user where user.id=sendvideocomment.userid and videoid=${id}`;
        let fun = async () => {
            let fincomment = await moduleData(sql);
            let sendcomment = await ((data) => {
                return new Promise((resolve, reject) => {
                    moduleData(sqlfind).then((res) => {
                        //数据整合
                        data.map((val, index) => {
                            val.send = [];
                            res.map((v, i) => {
                                if (val.cid == v.vcid) {
                                    val.send.push(v);
                                }
                            });
                        });
                        resolve(data);
                    });
                });
            })(fincomment);
            return sendcomment;
        }
        return fun();
    },
    updateZan(id, zan, tab) {
        //修改赞
        let sql = "";
        if (tab) {
            sql = `update sendvideocomment set vzan=${zan} where id=${id}`;
        }
        else {
            sql = `update videocomment set zan=${zan} where id=${id}`;
        }
        return moduleData(sql);
    },
    findvideotype(type) {
        let sql = `select * from (select id,name,type,jibie,isfree,group_concat(jibie,number) as jnum,islook from radio group by name order by jnum) as b where type=${type}`;
        return moduleData(sql);
    },
    findComplate() {
        //找网站模板的博客
        let sql = `select user.name as username,user.face,b.id as blogid,b.name,b.detail,blogface,type,gotime from (select userblog.id,userblog.userid,userblog.name,userblog.detail,blogface,blogType.type,gotime from userblog,blogType where userblog.type=blogType.id and blogType.typeid=2 order by gotime desc limit 10) as b,user where b.userid=user.id`;
        return moduleData(sql);
    },
    findComplateone(id) {
        let sql = `select user.name as username,user.face,b.id as blogid,b.name,b.detail,blogface,type,gotime from (select userblog.id,userblog.userid,userblog.name,userblog.detail,blogface,blogType.type,gotime from userblog,blogType where userblog.type=blogType.id and blogType.typeid=2 and blogType.id=${id} order by gotime desc limit 10) as b,user where b.userid=user.id`;
        return moduleData(sql);
    },
    findblogData(id) {
        let sql = `select userblog.id as bid,userblog.name as bname,gotime,number,user.name,content from userblog,user where user.id=userblog.userid and userblog.id=${id}`;
        return moduleData(sql);
    },
    findup(id) {
        //找上一篇
        let sql = `select id,name,type from userblog where id<${id} order by id desc limit 1`;
        return moduleData(sql);
    },
    finddown(id) {
        //找下一篇
        let sql = `select id,name,type from userblog where id>${id} order by id asc limit 1`;
        return moduleData(sql);
    },
    findblogcomment(id, way) {
        //根据id查博客评论
        let sql = `select comment.id as cid,user.name,user.face,content,ctime,zan from comment,user where comment.userid=user.id and blogid=${id} ${way ? `order by ${way} desc` : ''}`;
        let fun = async () => {
            let findcomment = await moduleData(sql);
            let send = await ((data) => {
                return new Promise((resolve, reject) => {
                    let findsend = `select sendcomment.id as sid,comid,user.name,user.face,scon,stime,szan  from sendcomment,user where sendcomment.userid=user.id and blogid=${id} `;
                    moduleData(findsend).then((result) => {
                        console.log(result);
                        data.map((val, index) => {
                            val.send = [];
                            result.map((v, i) => {
                                if (val.cid == v.comid) {
                                    val.send.push(v);
                                }
                            });
                        });
                        resolve(data);
                    });
                });
            })(findcomment);
            return send;
        }
        return fun();
    },
    updateblogZan(id, zan, tab) {
        //修改赞
        let sql = "";
        if (tab) {
            sql = `update sendcomment set szan=${zan} where id=${id}`;
        }
        else {
            sql = `update comment set zan=${zan} where id=${id}`;
        }
        return moduleData(sql);
    },
    findblog() {
        //首页  博客列表
        let sql = "select user.name as username,user.face,b.id as blogid,b.name,b.detail,blogface,type,gotime from (select userblog.id,userblog.userid,userblog.name,userblog.detail,blogface,blogType.type,gotime from userblog,blogType where userblog.type=blogType.id and blogType.typeid=1  order by gotime desc limit 0,5) as b,user where b.userid=user.id";
        return moduleData(sql);
    },
    findblogeone(id) {
        let sql = `select user.name as username,user.face,b.id as blogid,b.name,b.detail,blogface,type,gotime from (select userblog.id,userblog.userid,userblog.name,userblog.detail,blogface,blogType.type,gotime from userblog,blogType where userblog.type=blogType.id and blogType.typeid=1 and blogType.id=${id} order by gotime desc limit 0,5) as b,user where b.userid=user.id`;

        return moduleData(sql);
    },
    findlist(now, num) {
        //时间轴分页
        let sql = `select id,name,gotime,type from userblog limit ${now * num},${num}`;
        return moduleData(sql);
    },
    finduser() {
        let sql = "select * from user where id=1";
        return moduleData(sql);
    },
    findmessage(way) {
        let sql = `select message.id as cid,message.content,message.time,message.zan,user.name,user.face  from message left join user on message.userid=user.id  ${way ? `order by ${way} desc` : ''}`;
        //return moduleData(sql);
        let sqlfind = `select sendmessage.id as sid,mid,content,time,zan,user.name,user.face from sendmessage,user where user.id=sendmessage.userid `;
        let fun = async () => {
            let fincomment = await moduleData(sql);
            let sendcomment = await ((data) => {
                return new Promise((resolve, reject) => {
                    moduleData(sqlfind).then((res) => {
                        //数据整合
                        data.map((val, index) => {
                            val.send = [];
                            res.map((v, i) => {
                                if (val.cid == v.mid) {
                                    val.send.push(v);
                                }
                            });
                        });
                        resolve(data);
                    });
                });
            })(fincomment);
            return sendcomment;
        }
        return fun();
    },
    updatemessZan(id, zan, tab) {
        //修改赞
        let sql = "";
        if (tab) {
            sql = `update sendmessage set zan=${zan} where id=${id}`;
        }
        else {
            sql = `update message set zan=${zan} where id=${id}`;
        }
        return moduleData(sql);
    },
    userlogin(email, pwd) {
        //用户登录
        let sql = `select count(*) as count from user where email='${email}' and pwd='${pwd}'`;
        return moduleData(sql);
    },
    finduserinfo(email) {
        //查找用户信息
        let sql = `select * from user where email='${email}'`;
        return moduleData(sql);
    },
    insertmsg(id, txt, time, zan) {
        //增加留言
        console.log(time);
        let sql = `insert into message values(null,${id},'${txt}','${time}',${zan})`;
        return moduleData(sql);
    },
    updateuser(name, sex, age, address, photo, detail, job, face, email, pwd, id) {
        let sql = `update user set name='${name}',sex='${sex}',age=${age},address='${address}',photo='${photo}',detail='${detail}',job='${job}',face='${face}',email='${email}',pwd='${pwd}' where id=${id}`;

        return moduleData(sql);
    },
    insertbanner(src) {
        let sql = `insert into banner values (null,'${src}')`;
        return moduleData(sql);
    },
    updatelogo(content, logo) {
        let sql = `update logo set logo='${logo}',eveyDay='${content}' where id=1`;
        return moduleData(sql);
    },
    updatemenu(id, name, status) {
        let sql = `update navtitle set name='${name}',status='${status}' where id=${id}`;
        return moduleData(sql);
    },
    selectmenu(id) {
        let sql = `select name,status from navtitle where id=${id}`;
        return moduleData(sql);
    },
    findblogType() {
        let sql=`select id,type from blogtype`;
        return moduleData(sql);
    },
    insertblog(name,type,detail,content,face,time){
        let sql=`insert into userblog values(null,'${name}','${detail}',0,1,'${time}','${content}',${type},'${face}')`;
        return moduleData(sql);
    },
    insertVideo(name,url,num){
        let sql=`insert into  radio values(null,'${name}','${url}','',0,0,0,3,0,${num},'no')`;
        return moduleData(sql);
    },
    selectvideo(){
        let sql="select id,name from radio order by id desc";
        return moduleData(sql);
    },
    findvideoinfo(id){
        let sql=`select * from radio where id=${id}`;
        return moduleData(sql);
    },
    findvidetype(){
        let sql=`select * from radiotype`;
        return moduleData(sql);
    },
    updatevideo(detail,price,isfree,type,jibie,islook,id){
        let sql=`update radio set detail='${detail}',price=${price},isfree=${isfree},type=${type},jibie=${jibie},islook='${islook}' where id=${id}`;
        return moduleData(sql);
    }
}