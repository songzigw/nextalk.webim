/*!
 *
 * songm.util.js v0.1
 * http://songm.cn/
 *
 * Copyright (c) 2014 songm
 *
 */

(function(util) {
    "use strict";

    util.version = '0.1';
    
    Date.prototype.format = function(format) {
        var o = {
            // month
            "M+" : this.getMonth() + 1,
            // day
            "d+" : this.getDate(),
            // hour
            "h+" : this.getHours(),
            // minute
            "m+" : this.getMinutes(),
            // second
            "s+" : this.getSeconds(),
            // quarter
            "q+" : Math.floor((this.getMonth() + 3) / 3),
            // millisecond
            "S" : this.getMilliseconds()
        }

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + "")
                    .substr(4 - RegExp.$1.length));
        }

        for ( var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
                        : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    };
    
    var JSON = window.JSON
            || (function() {
                var chars = {
                    '\b' : '\\b',
                    '\t' : '\\t',
                    '\n' : '\\n',
                    '\f' : '\\f',
                    '\r' : '\\r',
                    '"' : '\\"',
                    '\\' : '\\\\'
                };

                function rChars(chr) {
                    return chars[chr] || '\\u00'
                            + Math.floor(chr.charCodeAt() / 16).toString(16)
                            + (chr.charCodeAt() % 16).toString(16);
                }

                function encode(obj) {
                    switch (Object.prototype.toString.call(obj)) {
                    case '[object String]':
                        return '"' + obj.replace(/[\x00-\x1f\\"]/g, rChars)
                                + '"';
                    case '[object Array]':
                        var string = [], l = obj.length;
                        for (var i = 0; i < l; i++) {
                            string.push(encode(obj[i]));
                        }
                        return '[' + string.join(",") + ']';
                    case '[object Object]':
                        var string = [];
                        for ( var key in obj) {
                            var json = encode(obj[key]);
                            if (json)
                                string.push(encode(key) + ':' + json);
                        }
                        return '{' + string + '}';
                    case '[object Number]':
                    case '[object Boolean]':
                        return String(obj);
                    case false:
                        return 'null';
                    }
                    return null;
                }

                return {
                    stringify : encode,
                    parse : function(str) {
                        str = str.toString();
                        if (!str || !str.length)
                            return null;
                        return (new Function("return " + str))();
                        // if (secure && !(/^[,:{}\[\]0-9.\-+Eaeflnr-u
                        // \n\r\t]*$/).test(string.replace(/\\./g,
                        // '@').replace(/"[^"\\\n\r]*"/g, ''))) return null;
                    }
                }
            })();

    var nowMillis = function() {
        return (new Date).getTime();
    };
    
    String.prototype.trim = function() {
        return (this || "").replace(/^\s+|\s+$/g, "");
    };
    
    /**
     * 
     * Validate an object's parameter names to ensure they match a list of
     * expected variables name for this option type. Used to ensure option
     * object passed into the API don't contain erroneous parameters.
     * 
     * @param {Object}
     *                obj - User options object
     * @param {Object}
     *                keys - valid keys and types that may exist in obj.
     * @throws {Error}
     *                Invalid option parameter found.
     */
    var validate = (function() {
        var isSameType = function(data, dataType) {
            if (typeof dataType === 'string') {
                if (dataType === 'array'
                        && isArray(data)) {
                    return true;
                }
                if (typeof data === dataType) {
                    return true;
                }
            }

            if (isArray(dataType)) {
                for (var i = 0; i < dataType.length; i++) {
                    if (data == dataType[i]) {
                        return true;
                    }
                }
            }

            return false;
        };

        return function(obj, keys) {
            for ( var key in obj) {
                if (!obj[key]) {
                    continue;
                }
                if (obj.hasOwnProperty(key)) {
                    if (keys.hasOwnProperty(key)) {
                        var dataType = keys[key].type;
                        if (!isSameType(obj[key], dataType)) {
                            throw new Error(
                                    format({text : "Invalid type {0} for {1}."},
                                           [typeof obj[key], key]));
                        }
                    }
                    else {
                        var errStr = "Unknown property, " + key
                                + ". Valid properties are:";
                        for ( var key in keys)
                            if (keys.hasOwnProperty(key))
                                errStr = errStr + " " + key;
                        throw new Error(errStr);
                    }
                }
            }
            for (var key in keys) {
                if (keys[key].requisite) {
                    if (!obj.hasOwnProperty(key) || !obj[key]) {
                        throw new Error(
                                format({text : "Parameter empty for {0}."},
                                       [key]));
                    }
                }
            }
        };
    })();

    /**
     *
     * Format an error message text.
     * 
     * @param {error} ERROR.KEY value above.
     * @param {substitutions}
     *                [array] substituted into the text.
     * @return the text with the substitutions made.
     */
    var format = function(error, substitutions) {
        var text = error.text;
        if (substitutions) {
            var field, start;
            for (var i = 0; i < substitutions.length; i++) {
                field = "{" + i + "}";
                start = text.indexOf(field);
                if (start > 0) {
                    var part1 = text.substring(0, start);
                    var part2 = text.substring(start + field.length);
                    text = part1 + substitutions[i] + part2;
                }
            }
        }
        return text;
    };
    
    var extend = function() {
        // copy reference to target object
        var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep
        // copy)
        if (typeof target !== "object" && !isFunction(target))
            target = {};
        for (; i < length; i++)
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null)
                // Extend the base object
                for ( var name in options) {
                    var src = target[name], copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy)
                        continue;

                    // Recurse if we're merging object values
                    if (deep && copy && typeof copy === "object"
                            && !copy.nodeType)
                        target[name] = extend(deep,
                        // Never move original objects, clone them
                        src || (copy.length != null ? [] : {}), copy);

                    // Don't bring in undefined values
                    else if (copy !== undefined)
                        target[name] = copy;

                }

        // Return the modified object
        return target;
    };
    
    var makArray = function(array) {
        var ret = [];
        if (array != null) {
            var i = array.length;
            // The window, strings (and functions) also have 'length'
            if (i == null || typeof array === "string" || isFunction(array)
                    || array.setInterval)
                ret[0] = array;
            else
                while (i)
                    ret[--i] = array[i];
        }
        return ret;
    };
    
    var each = function(object, callback, args) {
        var name, i = 0, length = object.length, isObj = length === undefined
                || isFunction(object);

        if (args) {
            if (isObj) {
                for (name in object) {
                    if (callback.apply(object[name], args) === false) {
                        break;
                    }
                }
            } else {
                for (; i < length;) {
                    if (callback.apply(object[i++], args) === false) {
                        break;
                    }
                }
            }
            // A special, fast, case for the most common use of each

        } else {
            if (isObj) {
                for (name in object) {
                    if (callback.call(object[name], name, object[name]) === false) {
                        break;
                    }
                }
            } else {
                for (var value = object[0]; i < length
                        && callback.call(value, i, value) !== false; value = object[++i]) {
                }
            }
        }

        return object;
    };

    var inArray = function(elem, array) {
        for (var i = 0, length = array.length; i < length; i++) {
            if (array[i] === elem) {
                return i;
            }
        }

        return -1;
    };

    var grep = function(elems, callback, inv) {
        var ret = [];

        // Go through the array, only saving the items
        // that pass the validator function
        for (var i = 0, length = elems.length; i < length; i++) {
            if (!inv !== !callback(elems[i], i)) {
                ret.push(elems[i]);
            }
        }

        return ret;
    };

    var map = function(elems, callback) {
        var ret = [], value;

        // Go through the array, translating each of the items to their
        // new value (or values).
        for (var i = 0, length = elems.length; i < length; i++) {
            value = callback(elems[i], i);

            if (value != null) {
                ret[ret.length] = value;
            }
        }

        return ret.concat.apply([], ret);
    };

    var ClassEvent = function(type) {
        this.type = type;
        this.timeStamp = (new Date()).getTime();
    };
    ClassEvent.on = function() {
        var proto, helper = ClassEvent.on.prototype;
        for (var i = 0, l = arguments.length; i < l; i++) {
            proto = arguments[i].prototype;
            proto.bind = proto.addEventListener = helper.addEventListener;
            proto.unbind = proto.removeEventListener = helper.removeEventListener;
            proto.trigger = proto.dispatchEvent = helper.dispatchEvent;
        }
    };
    ClassEvent.on.prototype = {
        addEventListener : function(type, listener) {
            var self = this, ls = self.__listeners = self.__listeners || {};
            ls[type] = ls[type] || [];
            ls[type].push(listener);
            return self;
        },
        dispatchEvent : function(event, extraParameters) {
            var self = this, ls = self.__listeners = self.__listeners || {};
            event = event.type ? event : new ClassEvent(event);
            ls = ls[event.type];
            if (Object.prototype.toString.call(extraParameters) === "[object Array]") {
                extraParameters.unshift(event);
            } else {
                extraParameters = [ event, extraParameters ];
            }
            if (ls) {
                for (var i = 0, l = ls.length; i < l; i++) {
                    ls[i].apply(self, extraParameters);
                }
            }
            return self;
        },
        removeEventListener : function(type, listener) {
            var self = this, ls = self.__listeners = self.__listeners || {};
            if (ls[type]) {
                if (listener) {
                    var _e = ls[type];
                    for (var i = _e.length; i--; i) {
                        if (_e[i] === listener)
                            _e.splice(i, 1);
                    }
                } else {
                    delete ls[type];
                }
            }
            return self;
        }
    };

    var cookie = function(name, value, options) {
        if (typeof value != 'undefined') {
            // name and value given, set cookie
            options = options || {};
            if (value === null) {
                value = '';
                // options = extend({}, options); 
                // clone object since it's
                // unexpected behavior if the expired property were changed
                options.expires = -1;
            }
            var expires = '';
            if (options.expires
                    && (typeof options.expires == 'number'
                    || options.expires.toUTCString)) {
                var date;
                if (typeof options.expires == 'number') {
                    date = new Date();
                    date.setTime(date.getTime()
                            + (options.expires * 24 * 60 * 60 * 1000));
                } else {
                    date = options.expires;
                }
                expires = '; expires=' + date.toUTCString();
                // use expires attribute, max-age is not supported by IE
            }
            // NOTE Needed to parenthesize options.path and options.domain
            // in the following expressions, otherwise they evaluate to
            // undefined
            // in the packed version for some reason...
            var path = options.path ? '; path=' + (options.path) : '';
            var domain = options.domain ? '; domain=' + (options.domain) : '';
            var secure = options.secure ? '; secure' : '';
            document.cookie = [ name, '=', encodeURIComponent(value), expires,
                    path, domain, secure ].join('');
        } else {
            // only name given, get cookie
            var cookieValue = null;
            if (document.cookie && document.cookie != '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie
                                .substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    };
    

    function HTMLEnCode(str) {
        var s = "";
        if (str.length == 0)
            return "";
        s = str.replace(/&/g, "&amp;");
        s = s.replace(/</g, "&lt;");
        s = s.replace(/>/g, "&gt;");
        s = s.replace(/ /g, "&nbsp;");
        s = s.replace(/\'/g, "&#39;");
        s = s.replace(/\"/g, "&quot;");
        s = s.replace(/\n/g, "<br />");
        return s;
    }
    function isUrl(str) {
        return /^http:\/\/[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"])*$/.test(str);
    }
    function stripHTML(str) {
        return str ? str.replace(/<(?:.|\s)*?>/g, "") : "";
    }

    
    extend(util, {
        extend     : extend,
        nowMillis  : nowMillis,
        trim       : trim,
        makeArray  : makeArray,
        each       : each,
        inArray    : inArray,
        grep       : grep,
        map        : map,
        JSON       : JSON,
        Date       : Date,
        validate   : validate,
        format     : format,
        ClassEvent : ClassEvent,
        cookie     : cookie,
        HTMLEnCode : HTMLEnCode,
        isUrl      : isUrl,
        stripHTML  : stripHTML
    });
    
})((function() {
    if (!window.songm) {
        window.songm = {};
    }
    if (!songm.util) {
        songm.util = {};
    }
    return songm.util;
})());
