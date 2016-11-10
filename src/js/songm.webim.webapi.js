/*!
 *
 * songm.webim.webapi.js v0.1
 * http://songm.cn/
 *
 * Copyright (c) 2014 songm
 *
 */

(function(webim) {
    "use strict";

    var WebAPI = function(options) {
        this.options = songm.util.extend({},
                WebAPI.DEFAULTS,
                options || {});
    };
    WebAPI.version = "0.1";
    WebAPI.DEFAULTS = {
        callback: null,
        apiPath: "/",
        cache: false,
        dataType: "jsonp",
        context: null
    };

    /** 实例化WebAPI */
    WebAPI._instance = null;
    /**
     * 获取实例化的WebAPI
     */
    WebAPI.getInstance = function() {
        if (!WebAPI._instance) {
            throw new Error("WebAPI is not initialized.");
        }
        return WebAPI._instance;
    };

    // WebAPI初始化
    WebAPI.init = function(options) {
        if (!WebAPI._instance) {
            WebAPI._instance = new WebAPI(options);
        }
        return WebAPI.getInstance();
    };

    // var callback = function(ret, err) {};
    WebAPI.prototype._ajax = function(apiPath, data, callback, ajaxInfo) {
        var _this = this, options = _this.options;
        var info = {
            url: options.apiPath + apiPath,
            data: data,
            dataType: options.dataType,
            cache: options.cache,
            context: options.context,
            success: function(ret) {
                if (typeof callback == "function") {
                    callback(ret, undefined);
                }
                // WebAPI成功返回结果后回调
                if (typeof options.callback == "function") {
                    options.callback();
                }
            },
            error: function(err) {
                if (typeof callback == "function") {
                    callback(undefined, err);
                }
            }
        };
        songm.util.extend(info, ajaxInfo || {});
        songm.ajax(info);
    };
    
    var methods = {
        message: function(params, callback) {
            this._ajax("polling/message", params, callback);
        }
    };
    songm.util.extend(WebAPI.prototype, methods);

    webim.WebAPI = WebAPI;
    webim.load = true;
})((function() {
    if (!window.songm) {
        window.songm = {};
    }
    if (!songm.webim) {
        songm.webim = {};
    }
    return songm.webim;
})());
