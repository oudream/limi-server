/**
 * Created by oudream on 2017/1/11.
 */

'use strict';

// define cjs
global.cjs = global.cjs || {};
// define CjJson
let CjConfig = cjs.CjConfig || {};
cjs.CjConfig = CjConfig;
// require depend
exports = module.exports = CjConfig;
if (! cjs.CjMeta) require('./../cjjson');

if (CjConfig.hasOwnProperty('loadDefault')) return;

CjConfig.loadDefault = function loadDefault() {

};


const path = require('path');
const fs = require('fs');

function loadConfigFile(filePath) {
    if (!filePath) {
        return -1;
    }

    if (!fs.existsSync(filePath)) {
        return -2;
    }

    if (filePath.indexOf('.json') == -1) {
        return -3;
    }

    return JSON.parse(fs.readFileSync(filePath));
}

function saveConfigFile(filePath, config) {
    if (!filePath || !config) {
        return -1;
    }

    return fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
}


module.exports = {
    load: loadConfigFile,
    save: saveConfigFile,
};


loadDefault();

