// Load required modules
var http = require("http"); // http server core module
var https = require('https');
var express = require("express"); // web framework external module
var serveStatic = require('serve-static'); // serve static files
var socketIo = require("socket.io"); // web socket external module
var easyrtc = require("easyrtc"); // EasyRTC internal module

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(serveStatic('static', {
    'index': ['index.html']
}));

app.use(serveStatic('public', {
    'index': ['index.html']
}));

var port = process.env.PORT || 8080;

app.get('/:room', (req, res, next) => {
    res.type('html');
    res.sendFile(__dirname + '/static/room.html');
});

// Start Express http server on port 8080
var webServer = http.createServer(app).listen(port, function () {
    console.log('listening on ' + port);
});;

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {
    "log level": 1
});

// Stun and Turn Servers definition
var myIceServers = [{
        "url": "stun:stun.sipgate.net"
    },
    {
        "url": "stun:217.10.68.152"
    },
    {
        "url": "stun:stun.sipgate.net:10000"
    },
    {
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
    }
    // {
    //     url: 'turn:192.158.29.39:3478?transport=udp',
    //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //     username: '28224511:1379330808'
    // },
    // {
    //     url: 'turn:192.158.29.39:3478?transport=tcp',
    //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //     username: '28224511:1379330808'
    // },
    // {
    //     url: 'turn:turn.bistri.com:80',
    //     credential: 'homeo',
    //     username: 'homeo'
    // },
    // {
    //     url: 'turn:turn.anyfirewall.com:443?transport=tcp',
    //     credential: 'webrtc',
    //     username: 'webrtc'
    // }
];

easyrtc.setOption("appIceServers", myIceServers);

easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function (socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function (err, connectionObj) {
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {
            "isShared": false
        });

        console.log("[" + easyrtcid + "] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function (connectionObj, roomName, roomParameter, callback) {
    console.log("[" + connectionObj.getEasyrtcid() + "] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function (err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function (appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});