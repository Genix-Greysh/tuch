'use strict';
const CryptoJS = require("crypto-js");
var tokenJson = require('../conf/token.json');
const fs = require('fs');
const path = require('path');
const root = require('../index');
const request = require('request');

/**
 * 构建Cos对象
 * @param {JSON} config  
 */
var Cos = function (config) {
    this.appId = config.appId;
    this.bucket = config.bucket;
    this.sid = config.sid;
    this.skey = config.skey;
    this.region = config.region;
};

/**
 * 获取 用户的签名；
 * 每个用户path不同，所以其签名也不同
 */
Cos.prototype.getAppSign = function () {
    var that = this;
    var random = parseInt(Math.random() * Math.pow(2, 32));
    var now = parseInt(Date.now() / 1000);
    var e = now + 7200; //签名过期时间为当前+7200s
    var str = 'a=' + that.appId+ '&b=' + that.bucket + '&k=' + that.sid + '&t=' + now + '&e=' + e  + '&r=' + random + '&f=';
    var sha1Res = CryptoJS.HmacSHA1(str, that.skey); // 这里使用CryptoJS计算sha1值，你也可以用其他开源库或自己实现
    var strWordArray = CryptoJS.enc.Utf8.parse(str);
    var resWordArray = sha1Res.concat(strWordArray);
    var res = resWordArray.toString(CryptoJS.enc.Base64);
    var result = {
        token: res,
        expires_time: e
    };
    return result;
};

/**
 * 
 * @param {String} path 
 */
Cos.prototype.getAppSignOnce = function (path) {
    var that = this;
    var random = parseInt(Math.random() * Math.pow(2, 32));
    var now = parseInt(Date.now() / 1000);
    var e = 0; // 单次签名 expire==0
    // pay attention
    var str = 'a=' + that.appId + '&k=' + that.sid + '&e=' + e + '&t=' + now + '&r=' + random + '&f=' + path + '&b=' + that.bucket;
    var sha1Res = CryptoJS.HmacSHA1(str, skey); // 这里使用CryptoJS计算sha1值，你也可以用其他开源库或自己实现
    var strWordArray = CryptoJS.enc.Utf8.parse(str);
    var resWordArray = sha1Res.concat(strWordArray);
    var res = resWordArray.toString(CryptoJS.enc.Base64);
};

/**
 * @return {Object} tokenJson 对象包括{token和过期时间}
 */
Cos.prototype.getToken = function () {
    var that = this;
    var currentTime = parseInt(Date.now() / 1000) + 10;
    if (tokenJson.token === '' || tokenJson.expires_time < currentTime) {
        tokenJson = that.getAppSign();
        console.log(tokenJson);
        fs.writeFileSync(path.join(root.rootUrl + '/conf/token.json'), JSON.stringify(tokenJson));
        return tokenJson;
    } else {
        return tokenJson;
    }
};

/**
 * 获取文件夹下所有文件
 */
Cos.prototype.listFiles = function (path) {
    var that = this;
    // 返回的是一个对象
    var token = that.getToken().token;
    var url = `https://${that.region}.file.myqcloud.com/files/v2/${that.appId}/${that.bucket}/${path}/?op=list`;
    var options = {
        url: url,
        headers: {
            'Host': 'cd.file.myqcloud.com',
            'Authorization': token
        }
    };

    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                var info = {
                    code: -1,
                    message: '请求失败'
                }
                reject(info);
            }
        });
    });
}

module.exports = Cos;