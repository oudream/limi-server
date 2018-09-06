'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

require('./../../common/cjs/cjlog.js');
const ci = cjs.daemon ? cjs.daemon : cjs;

const cjJson = require('./../../../assets/common/cjs/cjjson.js');
const fDaemonGloble = require('./daemon_global.js');

const DaemonGlobal = fDaemonGloble[0];
const ProcessStatus = fDaemonGloble[1];
const ProcessAlarm = fDaemonGloble[2];

exports = module.exports = DaemonAgent;

function DaemonAgent() {
}

function ScanRecord() {
    this.filepath = '';
    this.lastModifyTime = 0;
    this.fileSize = 0;
    this.scanOffset = 0;
}

DaemonAgent.daemonTargetName = 'daemon';
DaemonAgent.daemonFileName = '';

DaemonAgent.daemonLogPath = '';

DaemonAgent.processStatuses = [];
DaemonAgent.processAlarms = [];

let fCurrentScanRecord = new ScanRecord();

DaemonAgent.scan = function() {
    if (!path.isAbsolute(DaemonGlobal.daemonLogPath)) {
        return;
    }
    let sLogFilePath = path.join(DaemonGlobal.daemonLogPath, DaemonGlobal.getLogFileName());
    sLogFilePath = path.normalize(sLogFilePath);
    let stat;
    try {
        stat = fs.statSync(sLogFilePath);
        if (!stat.isFile()) {
            ci.info('DaemonAgent.scan fail. because of the path not is file.');
            ci.info(sLogFilePath);
            return;
        }
    } catch (e) {
        ci.info('DaemonAgent.scan');
        ci.info(e);
        ci.info(sLogFilePath);
        return;
    }
    fCurrentScanRecord.filePath = sLogFilePath;
    fCurrentScanRecord.lastModifyTime = stat.mtime;
    fCurrentScanRecord.fileSize = stat.size;
    if (stat.size <= fCurrentScanRecord.scanOffset) {
        fCurrentScanRecord.scanOffset = stat.size;
        return;
    }

    let fd = 0;
    try {
        fd = fs.openSync(sLogFilePath, 'r');
        let iPos = fCurrentScanRecord.scanOffset > 0 ? fCurrentScanRecord.scanOffset : 0;
        let iSize = fCurrentScanRecord.scanOffset > 0 ? stat.size - fCurrentScanRecord.scanOffset : stat.size;
    // 300MB
        if (iPos > stat.size || iPos > 1024 * 1024 * 300 || iSize > 1024 * 1024 * 300) {
            ci.info('DaemonAgent::scan error. file tool big.');
        } else {
            let buf = Buffer.allocUnsafe(iSize);
            let bytes = fs.readSync(fd, buf, 0, buf.length, iPos);
            if (bytes > 0) {
                let iDealed = DaemonAgent.publishDaemonData(buf);
                let iScanOffset = fCurrentScanRecord.scanOffset + iDealed;
                if (iScanOffset > stat.size) {
                    ci.info('inter error!!! DaemonAgent::scanOffset=', iScanOffset);
                    iScanOffset = stat.size;
                }
                fCurrentScanRecord.scanOffset = iScanOffset;
                ci.info('DaemonAgent::scanFileSize: ', stat.size, 'scanOffset: ', fCurrentScanRecord.scanOffset);
            }
        }
        fs.closeSync(fd);
    } catch (e) {
        if (fd) {
            fs.closeSync(fd);
        }
    }
};

DaemonAgent.publishDaemonData = function(sDaemonData) {
    let r = 0;
    let splitBuf = Buffer.from(',\r\n');
    let index = -1;
    let sDaemonLogs = [];
    do {
        index = sDaemonData.indexOf(splitBuf, r);
        if (index > r) {
            let sDaemonLog = sDaemonData.toString('utf8', r, index);
            sDaemonLogs.push(sDaemonLog);
        }
        if (index >= r) {
            r += (index - r) + splitBuf.length;
        }
    } while (index >= 0);
    let bInfo = true;
    if (sDaemonLogs.length > 100) {
        bInfo = false;
        ci.info('DaemonAgent::publishDaemonData begin. count ', sDaemonLogs.length);
    }
    let theInfo = function() {
        if (bInfo) {
            ci.info(...arguments);
        } else {
            ci.log(...arguments);
        }
    };
    for (let i = 0; i < sDaemonLogs.length; i++) {
        let sDaemonLog = sDaemonLogs[i];
        if (sDaemonLog.length > 10) {
            let daemonLog = cjJson.fromJson(sDaemonLog);
            if (!daemonLog) {
                theInfo('DaemonAgent.publishDaemonData error. daemonLog fromJson fail. json string : ', sDaemonLog);
                continue;
            }
            let logObject = daemonLog.d;
            switch (daemonLog.c) {
            case ProcessStatus.getLogClass():
                let processStatus = cjJson.refer2object(logObject, ProcessStatus);
                if (processStatus) {
                    this.addProcessStatus(processStatus);
                    theInfo('DaemonAgent::publishDaemonData success. c=', daemonLog.c);
                } else {
                    theInfo('DaemonAgent.publishDaemonData error. processStatus fromJson fail. json string : ', sDaemonLog);
                }
                break;
            case ProcessAlarm.getLogClass():
                let processAlarm = cjJson.refer2object(logObject, ProcessAlarm);
                if (processAlarm) {
                    this.addProcessAlarm(processAlarm);
                    theInfo('DaemonAgent::publishDaemonData success. c=', daemonLog.c);
                } else {
                    theInfo('DaemonAgent.publishDaemonData error. processAlarm fromJson fail. json string : ', sDaemonLog);
                }
                break;
            default:
                theInfo('DaemonAgent::publishDaemonData none. c=', daemonLog.c);
                break;
            }
        }
    }
    return r;
};
DaemonAgent.findProcessStatus = function(processName) {
    let processes = DaemonAgent.processStatuses;
    for (let i = 0; i < processes.length; i++) {
        let process = processes[i];
        if (process.process === processName) {
            return process;
        }
    }
    return null;
};

DaemonAgent.addProcessStatus = function(processStatus) {
    let processes = DaemonAgent.processStatuses;
    let process = DaemonAgent.findProcessStatus(processStatus.process);
    if (process === null) {
        processes.push(processStatus);
    }
};

DaemonAgent.findProcessAlarm = function(processName) {
    let processes = DaemonAgent.processAlarms;
    for (let i = 0; i < processes.length; i++) {
        let process = processes[i];
        if (process.process === processName) {
            return process;
        }
    }
    return null;
};

DaemonAgent.addProcessAlarm = function(processAlarm) {
    let processes = DaemonAgent.processAlarms;
    let process = DaemonAgent.findProcessAlarm(processAlarm.process);
    if (process === null) {
        processes.push(processAlarm);
    }
};

DaemonAgent.setTimer = function(interval) {
    let self = this;
    if (interval < 1000) {
        if (self.checkTimer) {
            clearTimeout(self.checkTimer);
        }
        return;
    }

    if (self.checkTimer) {
        clearTimeout(self.checkTimer);
    }

    let timeOut = function() {
    // 发送超时
        DaemonAgent.scan();

        self.checkTimer = setTimeout(timeOut, interval);
    };
    self.checkTimer = setTimeout(timeOut, interval);
};

DaemonAgent.init = function() {
    global.httpServer.route.all(/\/(.){0,}.daemoninitdata/, function(req, res) {
        let r = {
            data: {
                os: {
                    cpus: os.cpus(),
                    freemem: os.freemem(),
                    totalmem: os.totalmem(),
                },
                apps: DaemonAgent.processStatuses,
            },
        };

        let sReturnData = JSON.stringify(r);

        res.writeHead(200, {
            'Content-Type': 'text/json',
            'Access-Control-Allow-Origin': '*', /* ,'Content-Length' : dataLength */
        });
        res.write(sReturnData, 'utf-8');
        res.end();
    });

    DaemonAgent.setTimer(2000);
};
DaemonAgent.init();
