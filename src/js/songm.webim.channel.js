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
        // 入参验证
        songm.util.validate(options, {
            wsocket  : {type : 'string', requisite : true},
            httpd   : {type : 'string', requisite : true},
            tokenId  : {type : 'string', requisite : true},
            type     : {type : [Channel.type.XHR_POLLING,
                                Channel.type.WEBSOCKET],
                        requisite : false},
            sessionId: {type : 'string', requisite : false}
        });
        
        var _this = this;

        _this._init(options);

        // 当连接成功时触发
        _this.onConnected = null;
        // 当断开时候触发
        _this.onDisconnected = null;
        // 当有消息时触发
        _this.onMessage = null;

        _this.bind('connected', function(ev, data) {
            _this.status = Channel.CONNECTED;
            _this.session = new webim.Session(data);
            // 开启心跳定时器
            _this.heartbeat.start();
            if (_this.onConnected) {
                _this.onConnected(ev, data);
            }
        });
        _this.bind('disconnected', function(ev, data) {
            _this.status = Channel.DISCONNECTED;
            // 停止心跳定时器
            _this.heartbeat.stop();
            if (_this.onDisconnected) {
                _this.onDisconnected(ev, data);
            }
        });
        _this.bind('message', function(ev, data) {
            if (_this.onMessage) {
                var msg = new webim.Message({
                    conv : data.conv,
                    type : data.type,
                    from : data.from,
                    fNick: data.fNick,
                    fAvatar : data.fAvatar,
                    to : data.to,
                    tNick : data.tNick,
                    tAvatar : data.tAvatar,
                    body : data.body
                });
                _this.onMessage(ev, msg);
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
        _init : function(options) {
            this.options = songm.util.extend({}, Channel.DEFAULTS, options);
            this.type = this.options.type;
            this.status = Channel.DISCONNECTED;
            this.session = new webim.Session({
                tokenId: options.tokenId,
                sessionId: options.sessionId
            });
            
            var _t = this;
            // 心跳定时任务
            this.heartbeat = {
                _interval: null,
                start: function() {
                    this.stop();
                    this._interval = setInterval(function() {
                        _t.ws.send(JSON.stringify(
                            new webim.Protocol({
                                op: webim.operation.HEARTBEAT
                            })));
                    }, 30 * 1000);
                },
                stop: function() {
                    clearInterval(this._interval);
                }
            };
        },

        _newSocket : function() {
            var _this = this, ops = _this.options;
            _this.ws = new WebSocket(ops.wsocket + '/im');

            _this.ws.onopen = function(ev) {
                // 连接授权
                _this.ws.send(JSON.stringify(
                        new webim.Protocol({
                            op: webim.operation.CONN_AUTH,
                            body: _this.session
                        })));
            };
            _this.ws.onclose = function(ev) {
                _this.trigger('disconnected', [ ev.data ]);
            };
            _this.ws.onmessage = function(ev) {
                var pro = JSON.parse(ev.data);
                var body = pro.body;
                switch (pro.op) {
                case webim.operation.CONN_AUTH:
                    if (!body.succeed) {
                        _this.ws.close();
                    } else {
                        var ses = {sessionId: body.data.sessionId,
                                   tokenId  : body.data.tokenId,
                                   uid      : body.data.uid,
                                   token    : body.data.token}
                        _this.trigger('connected', [ ses ]);
                    }
                    break;
                case webim.operation.BROKER_MSG:
                    _this.trigger('message', [ body.data ]);
                    break;
                case webim.operation.HEARTBEAT:
                    break;
                default:
                    _this.trigger('response_' + pro.seq, [ body ]);
                    break;
                }
                _this.unbind('response_' + pro.seq);
            };
            return _this.ws;
        },

        _newComet : function() {
            var _this = this, ops = _this.options;

            _this.comet = new Comet(ops.httpd + '/polling/long', _this.session);
            // 注册长连接的事件监听器
            _this.comet.bind('open', function(ev, data) {
                _this.trigger("connected", [ data ]);
            });
            _this.comet.bind('close', function(ev, data) {
                _this.trigger('disconnected', [ data ]);
            });
            _this.comet.bind('message', function(ev, data) {
                if (data) {
                    _this.trigger('message', [ data ]);
                }
            });
            // 发起连接
            _this.comet.connect();
            return _this.comet;
        },

        /** 发起连接 */
        connect : function() {
            var _this = this;
            if (_this.status != Channel.DISCONNECTED) {
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
        sendMessage : function(pro, callback) {
            var _this = this;

            if (_this.status != Channel.CONNECTED) {
                callback(undefined, webim.error.CONNECT);
                return;
            }
            pro = new webim.Protocol(pro);
            if (_this.type == Channel.type.WEBSOCKET) {
                _this.bind('response_' + pro.seq, function(ev, ret) {
                    if (ret.succeed) {
                        if (!ret.data) {
                            ret.data = {};
                        }
                        callback(ret.data, undefined);
                    } else {
                        callback(undefined, ret);
                    }
                });
                _this.ws.send(JSON.stringify(pro));
            } else if (_this.type == Channel.type.XHR_POLLING) {
                var api = webim.WebAPI.getInstance();
                switch (pro.op) {
                case webim.operation.PUBLISH_MSG:
                    api.message({
                        session: _this.session.sessionId,
                        chId   : _this.session.chId,
                        from   : pro.body.from,
                        to     : pro.body.to}, callback);
                    break;
                default:
                    break;
                }
            }
        }
    };
    songm.util.ClassEvent.on(Channel);
    
    /**
     * XMLHttpRequest轮询
     */
    var Comet = function(url, session) {
        var _t = this;
        _t.URL = url;
        _t.session = new webim.Session(session);
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
            if (!_t._connecting) {
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
                        session: _t.session.sessionId,
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
                _t._onClose(webim.error.NETWORK);
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
            _t.session.tokenId = ses.tokenId;
            _t.session.sessionId = ses.sessionId;
            _t.session.chId = ses.attribute.ch_id;
            _t.session.uid = ses.uid;
            _t.session.token = ses.token;
            _t.trigger('open', [ _t.session ]);
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
})((function() {
    if (!window.songm) {
        window.songm = {};
    }
    if (!songm.webim) {
        songm.webim = {};
    }
    return songm.webim;
})());
