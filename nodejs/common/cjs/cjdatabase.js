'use strict';

// const sqlite3 = require('sqlite3').verbose();
let mysql = null;
if (typeof module !== 'undefined' && module.exports) {
    mysql = require('mysql');
} else {
    if (window.nodeRequire) {
        mysql = nodeRequire('mysql');
    }
}

/**
 * 数据库类
 * @param type: 数据库类型
 * @param dbParams: 数据库参数对象
 * {
 *      host: '127.0.0.1',
 *      user: 'ygct',
 *      pswd: 'ygct',
 *      dsn: 'db1',
 *      connectionLimit: 10,
 * }
 * @param fn_callback: 调用返回
 */

class CjDatabase {
    constructor(type, dbParams, fn_callback) {
        this.db = null;
        this.type = type;
        this.dbPool = null;
        this.id = dbParams.dsn;
        this.error = null;
        let _this = this;

        if (dbParams.host) {
            this.id = dbParams.host + ':' + dbParams.dsn;
        }

        if (type === 'sqlite') {
            let dsn = dbParams.dsn;
            this.db = new sqlite3.Database(dsn, function(err, res) {
                console.log(err);
                _this.error = err;
                fn_callback(err, res);
            });
        } else if (type === 'mysql') {
            let host = dbParams.host;
            let user = dbParams.user;
            let pwd = dbParams.pwd;
            let dsn = dbParams.dsn;
            let connectionLimit = dbParams.connectionLimit || 10;

            if (!host || !user || !pwd || !dsn) {
                console.log('Error : db params has error!');
                console.log({
                    'host': host,
                    'user': user,
                    'pwd': pwd,
                    'dsn': dsn,
                });

                let error = {'code': 'Error : db params has error!'};
                this.error = error;
                fn_callback(error);
            }

            this.dbPool = mysql.createPool({
                connectionLimit: connectionLimit,
                host: host,
                user: user,
                password: pwd,
                database: dsn,
                multipleStatements: true,
            });
        }
    }

    load(sql, fn_callback, sessionId) {
        let _this = this;
        if (!sql) {
            let error = {'code': 'Error : sql is null!'};
            console.log(error);
            this.error = error;
            fn_callback(error);
            return -1;
        }

        if (this.type === 'sqlite') {
            this.db.all(sql, function(err, res) {
                _this.error = err;
                fn_callback(err, res);
            });
        } else if (this.type === 'mysql') {
            this.dbPool.getConnection(function(err, conn) {
                if (err) {
                    console.log(err);
                    _this.error = err;
                    fn_callback(err, null, null);
                    return -2;
                } else {
                    conn.query(sql, function(qerr, vals, fields) {
            // 释放连接
                        conn.release();
            // 事件驱动回调
                        fn_callback(qerr, vals, fields, sessionId);
                    });
                }
            });
        }

        return 1;
    }

    loadT(sql, fn_callback, sessionId) {
        let _this = this;
        if (!sql) {
            let error = {'code': 'Error : sql is null!'};
            console.log(error);
            this.error = error;
            fn_callback(error);
            return -1;
        }
        if (this.type === 'sqlite') {
            this.db.run(sql, function(err, res) {
                _this.error = err;
                fn_callback(err, res);
            });
        } else if (this.type === 'mysql') {
            this.dbPool.getConnection(function(err, conn) {
                if (err) {
                    console.log(err);
                    _this.error = err;
                    fn_callback(err, null, null);
                    return -2;
                } else {
                    conn.query(sql, function(qerr, vals, fields) {
                        if (qerr) {
                            conn.query('rollback', function(err, vals) {
                    // 释放连接
                                conn.release();
                    // 事件驱动回调
                                fn_callback(qerr, vals, fields, sessionId);
                            });
                        } else {
                // 释放连接
                            conn.release();
                // 事件驱动回调
                            fn_callback(qerr, vals, fields, sessionId);
                        }
                    });
                }
            });
        }

        return 1;
    }
    exec(sql, fn_callback, sessionId) {
        let _this = this;
        if (!sql) {
            let error = {'code': 'Error : sql is null!'};
            console.log(error);
            this.error = error;
            fn_callback(error);
            return -1;
        }

        if (this.type === 'sqlite') {
            this.db.run(sql, function(err, res) {
                _this.error = err;
                fn_callback(err, res);
            });
        } else if (this.type === 'mysql') {
            this.dbPool.getConnection(function(err, conn) {
                if (err) {
                    console.log(err);
                    _this.error = err;
                    fn_callback(err, null, null);
                    return -2;
                } else {
                    conn.query(sql, function(qerr, vals, fields) {
                        if (qerr) {
                            conn.query('rollback', function(err, vals) {
                    // 释放连接
                                conn.release();
                    // 事件驱动回调
                                fn_callback(qerr, vals, fields, sessionId);
                            });
                        } else {
                // 释放连接
                            conn.release();
                // 事件驱动回调
                            fn_callback(qerr, vals, fields, sessionId);
                        }
                    });
                }
            });
        }

        return 1;
    }

    execM(sql, values, fn_callback, sessionId) {
        let _this = this;
        if (!sql) {
            let error = {'code': 'Error : sql is null!'};
            console.log(error);
            this.error = error;
            fn_callback(error);
            return -1;
        }

        if (this.type === 'mysql') {
            this.dbPool.getConnection(function(err, conn) {
                if (err) {
                    console.log(err);
                    _this.error = error;
                    fn_callback(err, null, null);
                    return -2;
                } else {
                    conn.query(sql, [values], function(qerr, vals, fields) {
            // 释放连接
                        conn.release();
            // 事件驱动回调
                        fn_callback(qerr, vals, fields, sessionId);
                    });
                }
            });
        }
        return 1;
    }

    close() {
        if (this.dbPool) {
            this.dbPool.end();
        }
    }

}

/**
 * 数据库管理类
 * @param dbsParam: 数据库参数对象
 *  [{
 *      host: '127.0.0.1',
 *      user: 'ygct',
 *      pswd: 'ygct',
 *      dsn: 'db1',
 *      connectionLimit: 10,
 * },
 * {
 *      host: '127.0.0.1',
 *      user: 'ygct',
 *      pswd: 'ygct',
 *      dsn: 'db1',
 *      connectionLimit: 10,
 * }]
 */
class DbManager {
    constructor(dbsParam) {
        this.databases = {};
        this.defaultDb = null;

        for (let db in dbsParam) {
            let _dbConfig = dbsParam[db];

            let param = {};
            for (let t in _dbConfig) {
                if (t != 'type') {
                    param[t] = _dbConfig[t];
                }
            }

            let _db = new CjDatabase(_dbConfig.type, param, function(err, res) {
                if (err) {
                    console.log(err);
                    throw err;
                }
            });

            this.databases[_db.id] = _db;
            if ( this.defaultDb === null ) {
                this.defaultDb = _db;
            }
        }
    }

    createDbConnect(dbParam) {
        let _db = this.findDb(dbParam.host, dbParam.dsn);
        if (_db === undefined) {
            _db = new CjDatabase(dbParam.type, dbParam, function(err, res) {
                if (err) {
                    console.log(err);
                    throw err;
                }
            });

            this.databases[_db.id] = _db;
            if ( this.defaultDb === null ) {
                this.defaultDb = _db;
            }
        }

        return _db;
    }

    closeDbConnect(host, dsn) {
        let _db = this.findDb(host, dsn);

        if (_db && _db !== -1) {
            _db.close();
        }
    }

    closeAllDbConnect() {
        for (let t in this.databases) {
            let _db = this.databases[t];
            _db.close();
        }
    }

    findDb(host, dsn) {
        if (!dsn) {
            console.log('dsn is null');
            return -1;
        }

        let _dbId = dsn;
        if (host) {
            _dbId = host + ':' + dsn;
        }
        return this.databases[_dbId];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        'CjDatabase': CjDatabase,
        'DbManager': DbManager,
    };
}
