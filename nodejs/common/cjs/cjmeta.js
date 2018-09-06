(function() {
    'use strict';

    if (typeof exports === 'object' && typeof global === 'object') {
        global.cjs = global.cjs || {};
    } else if (typeof window === 'object') {
        window.cjs = window.cjs || {};
    } else {
        throw Error('cjs only run at node.js or web browser');
    }
    let CjMeta = cjs.CjMeta || {};
    cjs.CjMeta = CjMeta;
    if (typeof exports === 'object' && typeof global === 'object') {
        exports = module.exports = CjMeta;
    }

    if (CjMeta.hasOwnProperty('checkStrict')) return;

    CjMeta.checkStrict = '(function() { return !this; })();';

  /**
   * get object's ClassName
   *
   * @param obj
   * @returns {*}
   */
    CjMeta.getObjectClassName = function(obj) {
        if (obj && obj.constructor && obj.constructor.toString()) {
      /*
       *  for browsers which have name property in the constructor
       *  of the object,such as chrome
       */
            if (obj.constructor.name) {
                return obj.constructor.name;
            }
            let str = obj.constructor.toString();
      /*
       * executed if the return of object.constructor.toString() is
       * "[object objectClass]"
       */

            let arr;
            if (str.charAt(0) === '[') {
                arr = str.match(/\[\w+\s*(\w+)\]/);
            } else {
        /*
         * executed if the return of object.constructor.toString() is
         * "function objectClass () {}"
         * for IE Firefox
         */
                arr = str.match(/function\s*(\w+)/);
            }
            if (arr && arr.length === 2) {
                return arr[1];
            }
        }
        return undefined;
    };

    CjMeta.objectTypeRegexp = /^\[object (.*)\]$/;
  /**
   *
   * @param obj
   * @returns {*}
   * usage : let a = []; getType(a) === 'Array'
   */
    CjMeta.getType = function getType(obj) {
        let type = Object.prototype.toString.call(obj).match(CjMeta.objectTypeRegexp)[1].toLowerCase();
    // Let "new String('')" return 'object'
        if (typeof Promise === 'function' && obj instanceof Promise) return 'promise';
    // PhantomJS has type "DOMWindow" for null
        if (obj === null) return 'null';
    // PhantomJS has type "DOMWindow" for undefined
        if (obj === undefined) return 'undefined';
        return type;
    };

  /**
   * Merge the property descriptors of `src` into `dest`
   *
   * @param {object} dest Object to add descriptors to
   * @param {object} src Object to clone descriptors from
   * @param {boolean} [redefine=true] Redefine `dest` properties with `src` properties
   * @returns {object} Reference to dest
   * @public
   */
    CjMeta.merge = function(dest, src, redefine) {
        if (!dest) {
            throw new TypeError('argument dest is required');
        }

        if (!src) {
            throw new TypeError('argument src is required');
        }

        if (redefine === undefined) {
      // Default to true
            redefine = true;
        }

        Object.getOwnPropertyNames(src).forEach(function forEachOwnPropertyName(name) {
            if (!redefine && hasOwnProperty.call(dest, name)) {
        // Skip desriptor
                return;
            }

      // Copy descriptor
            let descriptor = Object.getOwnPropertyDescriptor(src, name);
            Object.defineProperty(dest, name, descriptor);
        });

        return dest;
    };
})();
