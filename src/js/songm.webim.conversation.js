/*!
 *
 * songm.webim.conversation.js v0.1
 * http://songm.cn/
 *
 * Copyright (c) 2014 songm
 *
 */

(function(webim) {
    "use strict";

    var Conversation = function(options) {
        // 入参验证
        songm.util.validate(options, {
            type      : {type : [Conversation.PRIVATE,
                                 Conversation.GROUP,
                                 Conversation.NOTICE],
                         requisite : false},
            subjectum : {type : 'string', requisite : true},
            subNick   : {type : 'string', requisite : true},
            subAvatar : {type : 'string', requisite : true},
            objectum  : {type : 'string', requisite : true},
            objNick   : {type : 'string', requisite : true},
            objAvatar : {type : 'string', requisite : true},
            timestamp : {type : 'number', requisite : true},
            direction : {type : [webim.direction.SEND,
                                 webim.direction.RECEIVE],
                         requisite : true},
            body      : {type : 'string', requisite : true}
        });

        options = songm.util.extend({},
                Conversation.DEFAULTS, options || {});

        // 会话类型
        this.type = options.type;
        // 会话主体ID
        this.subjectum = options.subjectum;
        this.subNick = options.subNick;
        this.subAvatar = options.subAvatar;
        // 会话客体ID
        this.objectum = options.objectum;
        this.objNick = options.objNick;
        this.objAvatar = options.objAvatar;
        
        // 最近一次会话时间
        this.timestamp = options.timestamp;
        // 最近一次会话方向
        this.direction = options.direction;
        // 最近一次会话内容
        this.body = options.body;
        
        // 未读消息数
        this.unreadCount = 0;
        
        // 未读消息记录
        this.record = [];
    };
    Conversation.version = "0.1";
    songm.util.ClassEvent.on(Conversation);
    // 私聊
    Conversation.PRIVATE = 'private';
    // 群聊
    Conversation.GROUP = 'group';
    // 通知
    Conversation.NOTICE = 'notice';
    Conversation.DEFAULTS = {
        type: Conversation.PRIVATE,
        timestamp: songm.util.nowMillis(),
        direction: webim.direction.SEND
    };

    /**
     * 保存会话记录
     */
    Conversation.prototype.save = function(msg) {
        msg = new webim.Message(msg);
        
    };
    /**
     * 读取未读消息
     */
    Conversation.prototype.read = function() {
        
    };

    webim.Conversation = Conversation;
})((function() {
    if (!window.songm) {
        window.songm = {};
    }
    if (!songm.webim) {
        songm.webim = {};
    }
    return songm.webim;
})());
