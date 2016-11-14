/*!
 *
 * songm.webim.client.js v0.1
 * http://songm.cn/
 *
 * Copyright (c) 2014 songm
 *
 */

(function(webim) {
    "use strict";

    var sound = (function() {
        var playSound = true;
        var webimAudio;
        var play = function(url) {
            if (window.Audio) {
                if (!webimAudio) {
                    webimAudio = new Audio();
                }
                webimAudio.src = url;
                webimAudio.play();
            } else if (navigator.userAgent.indexOf('MSIE') >= 0) {
                try {
                    document.getElementById('songm.webim.bgsound').src = url;
                } catch (e) {}
            }
        };
        var _usrls = {
            lib: "sound.swf",
            msg: "sound/msg.mp3"
        };
        return {
            enable: function() {
                playSound = true;
            },
            disable: function() {
                playSound = false;
            },
            init: function(urls) {
                songm.util.extend(_urls, urls);
                if (!window.Audio && navigator.userAgent.indexOf('MSIE') >= 0) {
                    var soundEl = document.createElement('bgsound');
                    soundEl.id = 'songm.webim.bgsound';
                    soundEl.src = '#';
                    soundEl.autostart = 'true';
                    soundEl.loop = '1';
                    var dodys = document.getElementsByTagName('body');
                    if (dodys && dodys.length > 0) {
                        dodys[0].appendChild(soundEl);
                    }
                }
            },
            play: function(type) {
                var url = songm.util.isUrl(type) ? type : _urls[type];
                playSound && play(url);
            }
        }
    })();
    
    var Client = function(options) {
        // 入参验证
        songm.util.validate(options, {
            // 通信令牌
            token       : {type : 'string', requisite : true},
            wsocket     : {type : 'string', requisite : true},
            server      : {type : 'string', requisite : true},
            channelType : {type : [Channel.type.XHR_POLLING,
                                   Channel.type.WEBSOCKET],
                           requisite : false},
            session     : {type : 'string', requisite : false}
        });
        
        var _this = this;
        _this.options = extend({},
                Client.DEFAULTS, options || {});

        // 初始化Web业务服务API
        webim.WebAPI.init({
            apiPath : options.server
        });

        // 初始化
        _this._init();
    };
    Client.version = "0.1";
    /** 默认配置信息 */
    Client.DEFAULTS = {
        // 管道类型，默认为WebSocket
        // WebSocket->(XHR)Polling
        channelType : webim.Channel.type.WEBSOCKET
    };
    /** 初始化 */
    Client.prototype._init = function() {
        var _this = this, ops = _this.options;
        
        _this.session = new webim.Session({
            tokenId: ops.token, sessionId: ops.session});
        _this.connStatus = webim.connStatus.DISCONNECTED;
        // 客户端连接成功次数
        _this.connectedTimes = 0;
        // 未读消息总数
        _this.unreadTotal = 0;
        // 客户端会话信息
        _this.convList = [];

        _this._initListeners();
        _this._initTimerTask();
        return _this;
    };
    Client.prototype.getConv(type, sub, obj) {
        var _t = this;
        for (var i = 0; i < _t.convList.length; i++) {
            if (_t[i].type == type
                    && _t[i].subjectum == sub
                    && _t[i].objectum == obj) {
                return _t[i];
            }
        }
        return null;
    };
    Client.prototype.setCove(conv) {
        if (getConv(conv.type,
                conv.subject,
                conv.objectum)) {
            return;
        }
        convList[convList.length] = conv;
    };
    
    /**
     * 设置连接状态监听器
     */
    Client.prototype.setConnStatusListener = function(listener) {
        extend(this.connStatusListener, listener || {});
    };

    /**
     * 设置消息接收监听器
     */
    Client.prototype.setReceiveMsgListener = function(listener) {
        extend(this.receiveMsgListener, listener || {});
    };
    
    /** 绑定客户端存在的各种事件监听 */
    Client.prototype._initListeners = function() {
        var _this = this;
        // 连接状态监听器
        _this.connStatusListener = {
             onConnecting : function(data) {},
             onConnected : function(data) {},
             onDisconnected : function(data) {}
        };
        // 消息接收监听器
        _this.receiveMsgListener = {
            onDialogue : function(data) {}
        };

        // 正在连接
        _this.bind("connecting", function(ev, data) {
            console.log("connecting: " + JSON.stringify(data));
            if (_this.connStatus != webim.connStatus.CONNECTING) {
                _this.connStatus = webim.connStatus.CONNECTING;
                _this.connStatusListener.onConnecting(data);
            }
        });
        // 连接成功
        _this.bind("connected", function(ev, data) {
            console.log("connected: " + JSON.stringify(data));
            if (_this.connStatus != webim.connStatus.CONNECTED) {
                _this.connStatus = webim.connStatus.CONNECTED;
                _this.connectedTimes++;
                _this.session.sessionId = data.sessionId;
                _this.session.tokenId = data.tokenId;
                _this.session.uid = data.uid;
                _this.session.chId = data.chId;
                
                // ???
                
                _this.connStatusListener.onConnected(data);
            }
        });
        // 断开连接
        _this.bind("disconnected", function(ev, data) {
            console.log("disconnected: " + JSON.stringify(data));
            if (_this.connStatus != webim.connStatus.DISCONNECTED) {
                _this.connStatus = webim.connStatus.DISCONNECTED;
                _this.connStatusListener.onDisconnected(data);
            }
        });
        // 接收消息
        _this.bind("message", function(ev, data) {
            console.log("message: " + JSON.stringify(data));
            
            // ???
            
            _this.receiveMsgListener.onDialogue(data);
        });
    };
    /** 定义或开启部分定时任务 */
    Client.prototype._initTimerTask = function() {
        var _this = this;
    };
    
    /** 连接服务器 */
    Client.prototype.connectServer = function() {
        var _this = this, options = _this.options;
        // 如果没有断开服务器
        if (_this.connStatus != webim.connStatus.DISCONNECTED) {
            return;
        }
        
        // 触发正在连接服务事件
        _this.trigger("connecting", [ _this.session ]);
        // 创建通信管道
        _this.channel = new Channel({wsocket: options.wsocket,
                                     server: options.server,
                                     tokenId: options.token,
                                     sessionId: options.session,
                                     type: options.channelType});

        // 给管道注册事件监听器
        _this.channel.onConnected = function(ev, data) {
            _this.trigger("connected", [ data ]);
        };
        _this.channel.onDisconnected = function(ev, data) {
            _this.trigger("disconnected", [ data ]);
        };
        _this.channel.onMessage = function(ev, data) {
            _this.trigger("message", [ data ]);
        };

        // 发起管道连接
        _this.channel.connect();
    };
    /** 断开服务器 */
    Client.prototype.disconnectServer = function() {
        var _t = this;
        if (_t.channel) {
            _t.channel.close();
        }
    };
    /** 发送消息 */
    Client.prototype.sendMessage = function(msg, callback) {
        var _t = this;
        msg = new webim.Message(msg);
        
        if (!_t.channel) {
            callback(undefined, webim.error.CONNECT);
            return;
        }
        
        _t.channel.sendMessage(new webim.Protocol({
            op: webim.operation.MESSAGE,
            body: msg
        }), callback);
    };
    
    songm.util.ClassEvent.on(Client);
    
    webim.Client = Client;
})((function() {
    if (!window.songm) {
        window.songm = {};
    }
    if (!songm.webim) {
        songm.webim = {};
    }
    return songm.webim;
})());
