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

    var ws = new WebSocket('ws://localhost:8000/im');
    ws.onopen = function() {
        getAuth();
    };
    ws.onmessage = function(ev) {
        console.log(ev);
    };
    ws.onclose = function() {
        
    };
    
    function heartbeat() {            
        ws.send(JSON.stringify({              
            'ver': 1,         
            'op': 2,          
            'seq': 2,         
            'body': {         
                'to': '1',            
                'content': 'hello'            
            }         
        }));          
    }
    
    function getAuth() {              
        ws.send(JSON.stringify({              
            'ver': 1,         
            'op': 0,          
            'seq': 1,         
            'body': {         
                'user_id': '1',               
                'token': 'test'               
            }         
        }));          
    }

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
