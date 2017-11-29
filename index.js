const express = require('express');
const CryptoJS = require("crypto-js");
const Cos = require('./cos/cos');
const cosConf = require('./conf/cos.json');
const session = require('express-session');

const rootUrl = __dirname;

var app = express();
app.use(session({ secret: 'xunuo0x', cookie: { maxAge: 60000 }}));

var cosApp = new Cos(cosConf);

var bodyParser = require('body-parser');


// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

var userDao = require('./dao/userDao');

// request 请求
var request = require('request');

const appId = 'wx6fa4cddaa65450f2';
const appSecret = '9ef595a3997b032a41bb22d95350a0f6';


app.get('/', function (req, res) {
  console.log(Date.now());
  console.log(new Date().getTime());
  res.send('hello world');
});

app.post('/login', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  var code = req.body.code;
  var url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
  var options = {
    url: url,
    headers: {
      'User-Agent': 'request'
    }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      console.log(info);
      if (info.errcode === 40029) {
        return res.json(info);
      }
      userDao.queryByOpenid(info.openid, res, addUser);
    } else {
      res.json(body);
    }
  }
  // 向微信服务器发送请求
  request(options, callback);
});

/**
 * 添加用户
 * @param {String} openid 
 * @param {String} res 
 */
function addUser(openid, res) {
  userDao.add(openid, res);
}

/**
 * 多次签名：时长2h
 */
app.get('/auth', function (req, res) {
  var code = cosApp.getToken();
  res.send(code.token);
});

app.get('/users', function (req, res) {
  res.send('Get User');
});

app.get('/listFiles', function (req, res) {
  var path = req.query.path;
  cosApp.listFiles(path).then(function (data) {
    res.json(data);
  }).catch(function (err) {
    res.json(err);
  });
});
/**
 * Express托管静态文件;
 * 可通过http://localhost:3000/cat.png 访问图片
 */
app.use(express.static('public'));

/**
 * Express处理404
 */
app.use(function (req, res, next) {
  res.status(404).send('Sorry cant find that!');
});



var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

module.exports.rootUrl = rootUrl;