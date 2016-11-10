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
        var _this = this;

        _this._init(options);

        // 当连接成功时触发
        _this.onConnected = null;
        // 当断开时候触发
        _this.onDisconnected = null;
        // 当有消息时触发
        _this.onMessage = null;

        _this.bind("connected", function(ev, data) {
            _this.status = Channel.CONNECTED;
            if (_this.onConnected) {
                _this.onConnected(ev, data);
            }
        });
        _this.bind("disconnected", function(ev, data) {
            _this.status = Channel.DISCONNECTED;
            if (_this.onDisconnected) {
                _this.onDisconnected(ev, data);
            }
        });
        _this.bind("message", function(ev, data) {
            if (_this.onMessage) {
                _this.onMessage(ev, data);
            }
        });
    };
    Channel.version = "0.1";
    Channel.CONNECTING = 0;
    Channel.CONNECTED = 1;
    Channel.DISCONNECTED = 2;
    
    /** 管道类型 */
    Channel.type = {};
    (function(type) {
        type.XHR_POLLING = "XHR_POLLING";
        type.WEBSOCKET = "WEBSOCKET";
    })(Channel.type);
    
    Channel.DEFAULTS = {
        type : Channel.type.WEBSOCKET
    };

    Channel.prototype = {
        type : Channel.DEFAULTS.type,
        status : Channel.DISCONNECTED,

        _init : function(options) {
            this.options = extend({}, Channel.DEFAULTS, options || {});
            this.type = this.options.type;
            this.status = Channel.DISCONNECTED;
        },

        _newSocket : function() {
            var _this = this;
            var ops = _this.options;
            var ws = _this.ws = new WebSocket(ops.websocket);

            ws.onopen = function(ev) {
                // 连接授权
                ws.send({});
            };
            ws.onclose = function(ev) {
                _this.trigger('disconnected', [ ev.data ]);
            };
            ws.onmessage = function(ev) {
                var pro = JSON.parse(ev.data);
                var body = pro.body;
                switch (pro.op) {
                case webim.operation.CONN_AUTH:
                    if (!body.succeed) {
                        ws.close();
                    } else {
                        _this.trigger('connected', [ body.data ]);
                    }
                    break;
                case webim.operation.MSG_SEND:
                    _this.trigger('message', [ body.data ]);
                    break;
                default:
                    _this.targger('response' + pro.seq, [ body ]);
                    _this.unbind('response' + pro.seq);
                    break;
                }
            };
            return ws;
        },

        _newComet : function() {
            var _this = this;
            var ops = _this.options;

            var comet = _this.comet = new Comet(ops.server, ops.token);
            // 注册长连接的事件监听器
            comet.bind("open", function(ev, session) {
                _this.trigger("connected", [ session ]);
            });
            comet.bind("close", function(ev, error) {
                _this.trigger('disconnected', [ error ]);
            });
            comet.bind("message", function(ev, message) {
                if (message) {
                    _this.trigger('message', [ message ]);
                }
            });
            // 发起连接
            comet.connect();
            return comet;
        },

        /** 发起连接 */
        connect : function() {
            var _this = this;
            if (_this.status == Channe.CONNECTING) {
                return;
            }
            var ops = _this.options;
            _this.status = Channel.CONNECTING;

            if (ops.type == Channel.type.WEBSOCKET) {
                if (window.WebSocket) {
                    _this.type = Channel.type.WEBSOCKET;
                    _this._newSocket();
                    return;
                }
            }

            _this.type = Channel.type.XHR_POLLING;
            this._newComet();
        },

        /** 关闭连接 */
        disconnect : function() {
            var _this = this;

            if (_this.type == Channel.type.WEBSOCKET) {
                _this.ws.close();
            }
            if (_this.type == Channel.type.XHR_POLLING) {
                _this.comet.close();
            }
        },

        /** 发送消息 */
        sendMessage : function(msg) {
            var _this = this;

            if (_this.type == Channel.type.WEBSOCKET) {
                _this.ws.send(msg);
            }
            if (_this.type == Channel.type.XHR_POLLING) {
                _this.comet.send(msg);
            }
        }
    };
    songm.util.ClassEvent.on(Channel);
    
    /**
     * XMLHttpRequest轮询
     */
    var Coment = function(url, session) {
        var _t = this;
        _t.URL = url;
        if (typeof session === 'object') {
            _t.session = session;
        } else if (typeof session === 'string') {
            _t.session = {tokenId: sessioin}
        }
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
            // 轮询定时任务
            this._pollingTimer = null;
            // 轮询次数
            this._pollingTimes = 0;
            // 轮询失败次数
            this._failTimes = 0;
        },
        _startPolling: function() {
            var _t = this;
            var (!_t._connecting) {
                return;
            }
            // 开始轮询
            _t._onPolling = true;
            // 轮询次数
            _t._pollingTimes++;

            songm.ajax({
                url: _t.URL + (/\?/.test(_t.URL) ? "&" : "?") + 
                    songm.ajax.param({
                        token : _t.session.tokenId,
                        session: _t.session.sesId,
                        chId : _t.session.chId
                    }),
                cache: false,
                dataType: 'jsonp',
                success: _t._onPollingSuccess,
                error: _t._onPollingError
                // context: _t
            });
        },
        _onPollingSuccess: function(d) {
            var _t = this;
            _t._onPolling = false;
            // 连接成功 失败累加清零
            _t._failTimes = 0;
            if (!_t._connecting) {
                return;
            }
            
            if (!d.succeed) {
                _t._onClose({errorCode: d.errorCode, errorDesc: '连接错误'});
                return;
            }
            // 第一次轮询
            if (_t._pollingTimes == 1) {
                _t._onOpen(d.data);
            } else {
                _t._onMessage(d.data);
            }
            // 发起下一次轮询
            _t._setPollingTimer();
        },
        _onPollingError: function(m) {
            var _t = this;
            _t._onPolling = false;
            if (!_t._connecting) {
                return;
            }
            
            _t._failTimes++;
            if (_t._pollingTimes == 1) {
                // 连接失败，轮询次数清零
                _t._pollingTimes = 0;
            }
            if (_t._failTimes > 1) {
                _t._onClose({errorCode: 'NETWORK', errorDesc: '网络异常'});
            } else {
                _t._setPollingTimer();
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
                clearTimeout(_t._pollingTimer);
            }
            _t._onClose();
            return _t;
        },
        _onOpen: function(ses) {
            var _t = this;
            _t.readyState = Comet.OPEN;
            _t.session = {
                tokenId: ses.tokenId,
                sesId: ses.sessionId,
                chId: ses.attribute.ch_id
            };
            _t.trigger('open', [ session ]);
        },
        _onClose: function(error) {
            var _t = this;
            _t._setting();
            window.setTimeout(function() {
                _t.trigger('close', [ error ]);
            }, 1000);
        },
        _onMessage : function(message) {
            var _t = this;
            _t.trigger('message', [ message ]);
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
