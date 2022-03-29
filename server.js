// 服务启动文件
let express = require("express");
let bodyparser=require("body-parser");
let ejs = require("ejs");
let app = express();
//配置bodyparser
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
//配置cookie
let cookie=require("cookie-parser");
app.use(cookie("abcd"));

let IndexRouter = require("./routes/IndexRoute");
let admin=require("./routes/adminRoute");
//配置ejs
app.engine(".html", ejs.__express);
app.set("view engine", "html");
//默认的views  文件重新命名
app.set("views", __dirname + "/View");
//配置静态资源目录
app.use(express.static("Static"));

//设置cros
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});
//关联路由
app.use("/", IndexRouter);
app.use("/admin",admin)
app.listen(8000, "127.0.0.1", () => {
    console.log("服务器启动", "http://127.0.0.1:8000");
});