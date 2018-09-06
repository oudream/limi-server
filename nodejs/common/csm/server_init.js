const url = require('url');

const utils = require('./../../common/utils.js').utils;
const ShareCache = require('./../../common/share-cache.js').ShareCache;
const rtdb = require('./../../../assets/common/cc4k/rtdb.js');

let sessionList = [];

function init() {
  /**
   * 获取初始化数据的路由响应
   */
    global.httpServer.route.all(/\/(.){0,}\.test/, function(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/json',
            'Access-Control-Allow-Origin': '*', /* ,'Content-Length' : dataLength */
        });
        res.write('test', 'utf-8');
        res.end();
    });

    global.httpServer.route.all(/\/(.){0,}.omcinitdata/, function(req, res) {
        let paramsObj = url.parse(req.url, true).query;
        let remoteIp = utils.net.getRemoteIpAddress(req);
        let sessionId = paramsObj.sessionId;
        let fncode = paramsObj.fncode;
        let terminalType = paramsObj.terminalType;
        let date = new Date();
        let curUtc = date.getTime();
        let newSessionId = remoteIp + '_' + curUtc.toString() + '_' + '0';
        if ((!sessionId) || (sessionId === '')) {
            let _index = 1;
            while (sessionList.indexOf(newSessionId) !== -1) {
                newSessionId = remoteIp + '_' + curUtc.toString() + '_' + _index.toString();
                _index++;
            }
            sessionId = newSessionId;
        }

        let returnData = {
            sessionId: sessionId,
        };

        let sReturnData = '';
        if (fncode.indexOf('.data.svrinfo') !== -1) {
            let serverInfo = ShareCache.get('server-config');
            let neConfig = ShareCache.get('ne-config');
            let alarmConfig = ShareCache.get('alarm-config');
            let omcConfig = ShareCache.get('omc-server-config');
            for (let t in omcConfig) {
                serverInfo[t] = omcConfig[t];
            }
            let info = {
                serverInfo: serverInfo,
                neConfig: neConfig,
                alarmConfig: alarmConfig,
            };
            returnData['data'] = info;
            returnData['error'] = null;
        } else {
            returnData['data'] = null;
            returnData['error'] = 'fncode error';
        }

        sReturnData = JSON.stringify(returnData);

        cjs.omc.log('一个' + terminalType + '终端来自' + remoteIp + ',获取初始化数据...');
    // log.writeLog('一个' + terminalType + '终端来自' + remoteIp + ',获取初始化数据...');

        res.writeHead(200, {
            'Content-Type': 'text/json',
            'Access-Control-Allow-Origin': '*', /* ,'Content-Length' : dataLength */
        });
        res.write(sReturnData, 'utf-8');
        res.end();
    });

    global.httpServer.route.all(/\/(.){0,}\.rtdata\.cgi/, function(req, res) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', function(chunk) {
                body += chunk;
            });
            req.on('end', function() {
                console.log(body);
                let reqSession = null;
                let reqStructtype = null;
                let reqMeasures = null;
                if (body) {
                    try {
                        let reqBody = JSON.parse(body);
                        reqSession = reqBody.session;
                        reqStructtype = reqBody.structtype;
                        reqMeasures = reqBody.params;
                    } catch (e) {
                        r = null;
                        console.log('error: JSON.parse(body)');
                    }
                }
                if (reqSession && reqStructtype && reqMeasures) {
                    let resMeasures = {
                        session: reqSession,
                        structtype: reqStructtype,
                        data: function() {
                            let data = [];
                            for (let i = 0; i < reqMeasures.length; i++) {
                                let reqMeasure = reqMeasures[i];
                                let neno = reqMeasure.neno;
                                let code = reqMeasure.code;
                                let resMeasure = rtdb.findMeasureByNenoCode(neno, code);
                                if (resMeasure) {
                                    data.push(resMeasure);
                                }
                            }
                            return data;
                        }(),
                    };
                    res.writeHead(200);
                    // res.write('HELLO');
                    res.end(JSON.stringify(resMeasures));
                } else {
                    res.writeHead(404);
                    res.end();
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });
}

init();
