// mysql  封装代码
let mysql = require("mysql");
let config = require("./mysqlConfig");
let createConnect = (callback) => {
    let collection = mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
    });
    collection.connect();
    callback(collection);
}
module.exports = {
    //    封装查找的方法
    findData(sql, callback) {
        createConnect((collection) => {
            collection.query(sql, (err, data) => {
                if (err) {
                    throw err;
                }
                callback(JSON.parse(JSON.stringify(data)));
                collection.end();
            });
        });
    }
}
