/*!
 *
 * songm.webim.js v0.1
 * http://songm.cn/
 *
 * Copyright (c) 2014 songm
 *
 */

(function(webim) {
    "use strict";

    webim.version = '0.1';
    
    /** 操作项 */
    webim.operation = {
        // 连接授权
        CONN_AUTH: 1,
        // 发送聊天消息
        MESSAGE: 3,
        // 服务端发送数据到客户端
        MSG_SEND: 4
    };
    
    /** 各种异常 */
    webim.error = {
        NETWORK: {errorCode: 'NETWORK', errorDesc: '网路异常'}
        
    };
    
    /** 连接状态 */
    webim.connStatus = {
        // 连接中
        CONNECTING  : 0,
        // 连接成功
        CONNECTED   : 1,
        // 断开连接
        DISCONNECTED: 2
    };
    
    /** 网络状态 */
    webim.network = {
        // 不可用
        UNAVAILABLE : 0,
        // 可用
        AVAILABLE   : 1
    };
    
    /** 消息方向 */
    webim.direction = {
        SEND    : 'send',
        RECEIVE : 'receive'
    };
    
    webim.Protocol = function(ops) {
        // 入参验证
        songm.util.validate(ops, {
            ver : {type: 'number', requisite: false},
            seq : {type: 'number', requisite: false},
            op  : {type: 'number', requisite: true},
            body: {type: 'object', requisite: false}
        });
        
        ops = songm.util.extend({},
                webim.Protocol.DEFAULTS, ops);
        
        this.ver = ops.ver;
        this.seq = ops.seq;
        this.op = ops.op;
        this.body = ops.body;
    };
    webim.Protocol.DEFAULTS = {
        ver: 1,
        seq: songm.util.nowMillis()
    };
    
    webim.Session = function(ops) {
        // 入参验证
        songm.util.validate(ops, {
            sessionId: {type: 'string', requisite: false},
            tokenId  : {type: 'string', requisite: true},
            uid      : {type: 'string', requisite: false},
            chId     : {type: 'string', requisite: false}
        });

        this.sessionId = ops.sessionId;
        this.tokenId = ops.tokenId;
        this.uid = ops.uid;
        this.chId = ops.chId;
    };
    
    webim.Message = function(ops) {
        // 入参验证
        songm.util.validate(ops, {
            type   : {type : [webim.Message.TEXT,
                              webim.Message.IMAGE],
                      requisite : true},
            from   : {type : 'string', requisite : true},
            fNick  : {type : 'string', requisite : true},
            fAvatar: {type : 'string', requisite : true},
            to     : {type : 'string', requisite : true},
            toNick : {type : 'string', requisite : true},
            tAvatar: {type : 'string', requisite : true},
            body   : {type : 'string', requisite : true}
        });
        
        this.type = ops.type;
        this.from = ops.from;
        this.fNick = ops.fNick;
        this.fAvatar = ops.fAvatar;
        this.to = ops.to;
        this.tNick = ops.tNick;
        this.tAvatar = ops.Avatar;
        this.body = ops.body;
    };
    webim.Message.TEXT  = 'TEXT';
    webim.Message.IMAGE = 'IMAGE';
    
})((function() {
    if (!window.songm) {
        window.songm = {};
    }
    if (!songm.webim) {
        songm.webim = {};
    }
    return songm.webim;
})());
