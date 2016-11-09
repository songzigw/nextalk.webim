/*!
 *
 * songm.webim.channel.js v0.1
 * http://songm.cn/
 *
 * Copyright (c) 2014 songm
 *
 */

(function(webim) {
    "use strict";

    var Channel = function(options) {
        
    };
    Channel.version = "0.1";
    
    var Coment = function(url) {
        var _t = this;
        _t.URL = url;
        _t._setting();
    };
    // The connection has not yet been established.
    Comet.CONNECTING = 0;
    // The connection is established and communication is possible.
    Comet.OPEN = 1;
    // The connection has been closed or could not be opened.
    Comet.CLOSED = 2;
    
    // Make the class work with custom events
    Comet.prototype = {
        readyState: Comet.CLOSED,
        _setting: function() {
            this.readyState = Comet.CLOSED;
            // 是否已经连接
            this._connecting = false;
            // 设置连接开关避免重复连接
            this._onPolling = false;
            this._pollingTimer = null;
            this._pollingTimes = 0;
            this._failTimes = 0;
        },
        _startPolling: function() {
            var _t = this;
            var (!_t._connecting) {
                return;
            }
            _t._onPolling = true;
            _t._pollingTimes++;
            songm.ajax({
                url: _t.URL,
                cache: false,
                dataType: 'jsonp',
                success: _t._onPollingSuccess,
                error: _t.onPollingError,
                context: _t
            });
        },
        _onPollingSuccess: function(d) {
            var _t = this;
            _t._onPolling = false;
            if (_t._connecting) {
                // 第一次轮训
                if (_t._pollingTimes == 1) {
                    _t._onConnect();
                }
                _t._onData(d);
                // 连接成功 失败累加清零
                _t._failTimes = 0;
                _t._setPollingTimer();
            }
        },
        _onPollingError: function(m) {
            var _t = this;
            _t._onPolling = false;
            if (!_t._connecting) {
                return;
            }
            _t._failTimes++;
            if (_t._pollingTimes == 1) {
                _t._onError('Can not connect');
            } else {
                if (_t._failTimes > 1) {
                    _t._onClose(m);
                } else {
                    _t._setPollingTimer();
                }
            }
        },
        _setPollingTimer: function() {
            var _t = this;
            _t._pollingTimer = window.setTimeout(function() {
                _t._startPolling();
            }, 200);
        },
        connect: function() {
            var _t = this;
            if (_t._connecting) {
                return _t;
            }
            _t._connecting = true;
            _t.readyState = Comet.CONNECTING;
            if (!_t._onPolling) {
                window.setTimeout(function() {
                    _t._startPolling();
                }, 300);
            }
            return _t;
        },
        close: function() {
            var _t = this;
            if (_t._pollingTimer) {
                window.clearTimeout(_t._pollingTimer);
            }
            _t._onClose();
            return _t;
        },
        _onConnect: function() {
            var _t = this;
            _t.readyState = Comet.OPEN;
            _t.trigger('open', 'success');
        },
        _onClose: function(m) {
            var _t = this;
            _t._setting();
            window.setTimeout(function() {
                _t.trigger('close', [ m ]);
            }, 1000);
        },
        _onData : function(data) {
            var _t = this;
            _t.trigger('message', [ data ]);
        },
        _onError : function(text) {
            var _t = this;
            _t._setting();
            window.setTimeout(function() {
                _t.trigger('error', [ text ]);
            }, 1000);
        }
    };
    songm.util.ClassEvent.on(Comet);

    webim.Channel = Channel;
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
