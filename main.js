'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs');
const events = require('events');
const url = require('url');
const os = require('os');

require('./assets/common/cjs/cjinterinfo.js');
require('./assets/common/cjs/cjstring.js');
require('./assets/common/cjs/cjnumber.js');
require('./assets/common/cjs/cjmeta.js');
require('./assets/common/cjs/cjbuffer.js');
require('./nodejs/common/cjs/cjlog.js');
require('./nodejs/common/cjs/cjfs.js');
let HttpServer = require('./nodejs/common/csm/http_server.js');
const ShareCache = require('./nodejs/common/share-cache.js').ShareCache;
const configOpt = require('./nodejs/common/cjs/cj-json-config.js');
const utils = require('./nodejs/common/utils.js').utils;
const log = require('./nodejs/common/log.js');

let resMap = {};

function init() {
    console.log('process.cwd: ', process.cwd());

  /** 获取本地目录信息 */
    getLocalInfo();

  /** 加载配置文件 */
    loadConfigFile();

  /** 获取本地IP地址 */
    getLocalIp();

  /** 创建全局事件 */
    createGlobalEvent();

  /** 加载各个模块 */
    loadModules();

  /** 异常监听 */
    errorListener();

  /** SQL语句响应返回监听 */
    sqlResponseListener();

    let staticFilesPath = path.join(__dirname, './assets/');

    console.log('static files path : ' + staticFilesPath);

    let svr = new HttpServer({
        port: 9001,
        staticAssetsPath: staticFilesPath,
    });
    global.httpServer = svr;

    console.log('启动HTTP服务器完成');
  // log.writeLog('启动HTTP服务器完成...');

    svr.route.all(/\/(.){0,}.icsdata/, function fn(req, res) {
        let remoteIp = utils.net.getRemoteIpAddress(req);

        let paramsObj = url.parse(req.url, true).query;
        let sessionId = paramsObj.sessionId;
        let fncode = paramsObj.fncode;

        let returnData = {
            sessionId: sessionId,
        };

        if (fncode.indexOf('.data.svrstatus') !== -1) {
            returnData['data'] = {
                status: 200,
            };
            returnData['error'] = null;
        } else {
            returnData['data'] = null;
            returnData['error'] = 'fncode error';
        }

        let sReturnData = JSON.stringify(returnData);
        res.writeHead(200, {
            'Content-Type': 'text/json',
            'Access-Control-Allow-Origin': '*', /* ,'Content-Length' : dataLength */
        });
        res.write(sReturnData, 'utf-8');
        res.end();
    });

  /**
   * 运行SQL语句的路由响应
   */
    svr.route.all(/\/(.){0,}.sql/, function fn(req, res) {
    // 定义了一个data变量，用于暂存请求体的信息
        let data = '';

        let paramsObj = url.parse(req.url, true).query;

    // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到data变量中
        req.on('data', function(chunk) {
            data += chunk;
        });

    // 在end事件触发后，解释请求体，取出sql语句运行，然后向客户端返回结果。
        req.on('end', function() {
      // data = querystring.parse(data);
            if (data !== '') {
                let dataObj = JSON.parse(data);
                console.log(data);

                let remoteIp = utils.net.getRemoteIpAddress(req);

                let newResId = dataObj.sessionId;
                resMap[newResId] = res;

                cjs.log('收到来自' + remoteIp + '终端的SQL请求');
        // log.writeLog('收到来自' + remoteIp + '终端的SQL请求');

        /** 把请求转到数据库处理服务 */
                global.globalEvent.emit('sql-request', data);
            }
        });

        req.on('error', function(e) {
            console.log(`problem with request: ${e.message}`);
            throw e;
        });
    });

  /** 加载特定模块 */
    // load=ics/omc,ics/daemon
    let sLoad = cjs.CjString.findValueInArray(process.argv, 'load=');
    cjs.log('加载模块: ' + sLoad);
    sLoad = sLoad || 'ics/omc';
    if (sLoad.length > 0) {
        let sLoads = sLoad.split(/,|;/);
        for (let i = 0; i < sLoads.length; i++) {
            loadSpecialModules(path.join(__dirname, './nodejs/' + sLoads[i]));
        }
    }
}

/**
 * 获取本地目录信息
 */
function getLocalInfo() {
    let curWorkDir = __dirname;
    let _dir = curWorkDir.replace(/\\/g, '/');
    let _info = {
        current_work_dir: _dir,
    };

    ShareCache.createShareCache('local-info', _info);
}

/**
 * 获取本机IP地址
 */
function getLocalIp() {
    let iptable = {};
    let localIp = '';
    let ifaces = os.networkInterfaces();

    for (let dev in ifaces) {
        if (ifaces[dev].some(function(details) {
            if ((details.family == 'IPv4') && (details.internal == false)) {
                iptable['localIP'] = details.address;
                localIp = details.address;
                return true;
            } else {
                return false;
            }
        })) break;
    }

    let server = ShareCache.get('server-config', 'server');
    server['ipAddress'] = localIp;

    ShareCache.set('server-config', 'server', server);
}

/**
 * 加载配置文件
 */
function loadConfigFile() {
    let configPath = path.join(__dirname, '/config');
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, 0o777);
    }

    let configFilePath = path.normalize(path.join(configPath, '/config.json'));
    let _config = configOpt.load(configFilePath);

    if (typeof _config === 'object') {
        ShareCache.createShareCache('server-config', _config);

        cjs.log('加载配置文件完成');
    // log.writeLog('加载配置文件完成...');
    }
}

/**
 * 创建全局事件
 */
function createGlobalEvent() {
    let event = new events.EventEmitter();
    global.globalEvent = event;
}

/**
 * 异常监听器
 */
function errorListener() {
    process.on('uncaughtException', function(err) {
        console.error('An uncaught error occurred!');
        console.error(err.stack);

        cjs.log(JSON.stringify(err));
        cjs.log(JSON.stringify(err.stack));
    // log.writeSysLog(err);
    // log.writeSysLog(err.stack);
    // TODO: 将加入异常处理并记录
    });
}

/**
 * 加载公共模块
 */
function loadModules() {
    let files = glob.sync(path.join(__dirname, 'nodejs/modules/*/*.js'));
    files.forEach(function(file) {
        if (file !== undefined) {
            require(file);
            console.log('load success : ' + file);
            cjs.log('加载公共模块成功 : ' + file);
      // log.writeLog('加载公共模块成功 : ' + file);
        }
    });
}

/**
 * 加载特定模块
 * @param modulePath : String 模块目录
 */
function loadSpecialModules(modulePath) {
    let dirs = modulePath.split(path.sep);
    if (dirs.length) {
        let dir = dirs[dirs.length - 1];
        cjs.CjInterinfo.registerModule(dir);
    }
    let files = glob.sync(path.join(modulePath + '/*.js'));
    files.forEach(function(file) {
        if (file !== undefined) {
            require(file);
            console.log('load success : ' + file);
            cjs.log('加载特定模块成功 : ' + file);
      // log.writeLog('加载特定模块成功 : ' + file);
        }
    });
}

/**
 * SQL语句响应返回监听器
 */
function sqlResponseListener() {
  /** 接收数据库处理服务的结果并发回前端 */
    global.globalEvent.on('sql-response', function(data) {
        let msgObj = JSON.parse(data);

        let resId = msgObj.sessionId;
        let sReturnData = data;
        let _res = resMap[resId];

        if (_res) {
            try {
                _res.writeHead(200, {
                    'Content-Type': 'text/json',
                    'Access-Control-Allow-Origin': '*', /* , 'Content-Length' : dataLength */
                });
                _res.write(sReturnData, 'utf-8');
                _res.end();
            } catch (err) {
                console.log(err);
                cjs.log(JSON.stringify(err));
                cjs.log(JSON.stringify(err.stack));
        // log.writeSysLog(err);
        // log.writeSysLog(err.stack);
            }

            resMap[resId] = null;
            delete resMap[resId];
        }
    });
}

/** 启动 */
init();
