var mysql = require('mysql');
var $conf = require('../conf/db');
var $util = require('../util/util');
var $sql = require('./userSqlMapping');

var pool = mysql.createPool($util.extend({}, $conf.mysql));

module.exports = {
    add: function(openid, res, next){
        pool.getConnection(function(err, connection){
            connection.query($sql.insert, [openid, new Date().toLocaleString()], function(err, result){
                if(result){
                    var insertId = result.insertId;
                    result = {
                        code: 0,
                        msg: '添加成功',
                        openid: openid,
                        id:insertId
                    };
                }else{
                    result = {
                        code: -1,
                        msg: '添加失败'
                    };
                }
                res.json(result);
                connection.release();
            });
        });
    },
    queryByOpenid: function(openid, res, next){
        pool.getConnection(function(err, connection){
            connection.query($sql.queryByOpenId, openid, function(err, result){
                if(result.length){
                    res.json(result[0]);
                }else{
                    // 如果用户不存在;则需要添加此用户
                    next(openid, res);
                }
                connection.release();
            });
        });
    }
};