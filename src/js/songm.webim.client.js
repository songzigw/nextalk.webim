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

    var Client = function(options) {
        
    };
    Client.version = "0.1";

    webim.Client = Client;
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
