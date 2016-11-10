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
    
    function Protocol() {
        this.ver = 1;
        this.seq = null;
        this.op = null;
        this.body = null;
    }
    
    function Session() {
        this.sesId = null;
        this.tokenId = null;
        this.uid = null;
        this.chId = null;
    }
    
    function Message() {
        
    }
    
    function Conversation() {
        
    }
    
})((function() {
    if (!window.songm) {
        window.songm = {};
    }
    if (!songm.webim) {
        songm.webim = {};
    }
    return songm.webim;
})());
