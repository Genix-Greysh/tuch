// dao/userSqlMapping.js
// CRUD SQL语句
var user = {
	insert:'INSERT INTO tuch_user(openid, join_date) VALUES(?, ?)',
	update:'update tuch_user set name=?, age=? where id=?',
	delete: 'delete from tuch_user where id=?',
	queryByOpenId: 'select * from tuch_user where openid = ?',
	queryAll: 'select * from tuch_user'
};
 
module.exports = user;