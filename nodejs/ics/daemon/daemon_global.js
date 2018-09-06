'use strict';

const cjLog = require('./../../common/cjs/cjlog.js');
const cjFs = require('./../../common/cjs/cjfs.js');
const cjString = require('./../../common/cjs/cjstring.js');
const cjDate = require('./../../../assets/common/cjs/cjdate.js');
const cjJson = require('./../../../assets/common/cjs/cjjson.js');
const ci = cjs.daemon ? cjs.daemon : cjs;

const path = require('path');

exports = module.exports = [DaemonGlobal, ProcessStatus, ProcessAlarm];

function DaemonGlobal() {
}

DaemonGlobal.queryDaemonLogPath = function() {
    let sDir = path.normalize(path.join(__dirname, '../../../../'));
    let sSearchDir = 'log' + path.sep + 'daemon';
    return cjFs.findPathSync(sDir, sSearchDir);
};

DaemonGlobal.getLogFileName = function() {
    let r = cjDate.defaultDayString();
    return r + '.json';
};

DaemonGlobal.daemonLogPath = DaemonGlobal.queryDaemonLogPath();
ci.info('DaemonGlobal.daemonLogPath:', DaemonGlobal.daemonLogPath);

// this.fromJson = function(sJson){}
// std::string toJson()
function ProcessStatus() {
  // std::string
    this.getLogClass = function() {
        return 'ProcessStatus';
    };

    this.aid = 0;
    this.ord = 0;
    this.process = '';
    this.isRunnig = false;
    this.startTime = 0;
    this.startTimes = 0;
    this.receiveBytes = 0;
    this.lastReceiveTime = 0;
    this.recordTime = 0;
    this.syscpu = 0;
    this.sysmem = 0;
    this.cpu = 0;
    this.mem = 0;

  // const ProcessStatus &pss
    this.assignedFrom = function(pss) {
        this.isRunnig = pss.isRunnig;
        this.startTime = pss.startTime;
        this.startTimes = pss.startTimes;
        this.receiveBytes = pss.receiveBytes;
        this.lastReceiveTime = pss.lastReceiveTime;
        this.syscpu = pss.syscpu;
        this.sysmem = pss.sysmem;
        this.cpu = pss.cpu;
        this.mem = pss.mem;
    };

    this.toJson = function() {
        return JSON.stringify(this);
    };
}

ProcessStatus.fromJson = function(sJson) {
    return cjJson.fromJson(sJson, ProcessStatus);
};

function ProcessAlarm() {
    this.getLogClass = function() {
        return 'ProcessAlarm';
    };

    this.aid = 0;
    this.ord = 0;
    this.process = '';
    this.alarmTime = 0;
    this.alarmType = 0;
    this.alarmMsg = 0;

  // const ProcessAlarm & psa
    this.assignedFrom = function(psa) {
        this.alarmTime = psa.alarmTime;
        this.alarmType = psa.alarmType;
        this.alarmMsg = psa.alarmMsg;
    };
}

ProcessAlarm.fromJson = function(sJson) {
    return cjJson.fromJson(sJson, ProcessAlarm);
};

ProcessAlarm.AlarmTypeNone = 0;
ProcessAlarm.AlarmTypeHeartBeatTimeout = 1;
ProcessAlarm.AlarmTypeFinis = 2;
