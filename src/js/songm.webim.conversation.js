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
                         requisite : true},
            subjectum : {type : 'string', requisite : true},
            subNick   : {type : 'string', requisite : true},
            subAvatar : {type : 'string', requisite : true},
            objectum  : {type : 'string', requisite : true},
            objNick   : {type : 'string', requisite : true},
            objAvatar : {type : 'string', requisite : true},
            direction : {type : [webim.direction.SEND,
                                 webim.direction.RECEIVE],
                         requisite : true},
            body      : {type : 'string', requisite : false}
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
        this.timestamp = songm.util.nowMillis();
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
        direction: webim.direction.SEND
    };
    Conversation.msgToConv = function(msg) {
        var conv = {
            type : msg.conv,
            direction : msg.direction,
            body : 'Information'
        };
        if (msg.direction == webim.direction.SEND) {
            conv.subjectum = msg.from;
            conv.subNick = msg.fNick;
            conv.subAvatar = msg.fAvatar;
            conv.objectum = msg.to;
            conv.objNick = msg.tNick;
            conv.objAvatar = msg.tAvatar;
        } else {
            conv.subjectum = msg.to;
            conv.subNick = msg.tNick;
            conv.subAatar = msg.tAvatar;
            conv.objectum = msg.from;
            conv.objNick = msg.fNick;
            conv.objAvatar = msg.fAvatar;
        }
        
        return new Conversation(conv);
    };

    /**
     * 保存会话记录
     */
    Conversation.prototype.save = function(msg) {
        msg = new webim.Message(msg);
        this.record[this.record.length] = msg;
    };
    /**
     * 读取未读消息
     */
    Conversation.prototype.read = function() {
        var rec = this.record;
        this.record = [];
        return rec;
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
