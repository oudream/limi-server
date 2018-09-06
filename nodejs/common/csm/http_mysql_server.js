
'use strict';

let mysql = require('mysql');

exports = module.exports = HttpMySqlServer;

function HttpMySqlServer() {

}

HttpMySqlServer.mysqlPools = [];

HttpMySqlServer.mysqlDefaultPool = null;

HttpMySqlServer.dispatch = function dispatch(request, response) {

};

function MySqlServer() {
    this.pool = mysql.createPool({
        connectionLimit: 10,
        // host            : '10.31.16.253',
        host: '127.0.0.1',
        user: 'ygct',
        password: 'ygct',
        database: 'db1',
    });
    this.pool.query('select * from table1', function(err, rows, fields) {
        if (err) throw err;

        console.log(JSON.stringify(rows));
    });
    let testDb1 = function() {
        let sql = 'INSERT INTO Test (name, email, n) VALUES ?';
        let values = [
            ['demian', 'demian@gmail.com', 5],
            ['john', 'john@gmail.com', 6],
            ['mark', 'mark@gmail.com', 7],
            ['pete', 'pete@gmail.com', 8],
        ];
        pool.query(sql, [values], function(err) {
            if (err) throw err;
            pool.end();
        });
    };
    testDb1();
}

MySqlServer.prototype.dispatch = function dispatch(request, response) {
    response.end;
};


