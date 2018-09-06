/**
 * Created by liuchaoyu on 2017-04-27.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const ShareCache = require('./share-cache.js').ShareCache;
const utils = require('./utils').utils;
const projDir = ShareCache.get('local-info', 'current_work_dir');

let logPath = path.normalize(path.join(__dirname, '/../../log'));
if (!fs.existsSync(logPath)) {
    fs.mkdir(logPath, 0o777, function(err) {
        if (err) {
      // throw err;
            console.log('Error! Error! Error! log folder create fail !');
            console.log(err);
        }
    });
}

let lastDate = '';
let lastLogPath = '';

function writeLog(text) {
    write('normal', text);
}

function writeSysLog(text) {
    write('system', text);
}

function write(type, text) {
    let curLogPath = '';
    let curDate = utils.date.getDateTime('date', '-');
    if (curDate != lastDate) {
        curLogPath = path.normalize(path.join(logPath, '/' + curDate));

        lastDate = curDate;
        lastLogPath = curLogPath;
    }

    if (!fs.existsSync(lastLogPath)) {
        try {
            fs.mkdirSync(lastLogPath, 0o777);
        } catch (err) {
            throw err;
        }
    }

    let logFileName = 'log_' + type + '.txt';

  // if (type == 'normal') {
  //
  // }
  // else if (type == 'system') {
  //
  // }
    let logFile = path.normalize(path.join(lastLogPath, '/' + logFileName));

    let curDateTime = utils.date.getDateTime();

    let logText = curDateTime + ' : ' + text + ';\r\n';

    fs.appendFile(logFile, logText, null, function result(err) {
        if (err) {
      // throw err;
            console.log('Error! Error! Error! log record has error!');
            console.log(err);
        }
    });
}

module.exports = {
    'writeLog': writeLog,
    'writeSysLog': writeSysLog,
};
