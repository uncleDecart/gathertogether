// Load required modules
var https = require("https"); // https server core module
var fs = require("fs"); // file system core module
var express = require("express"); // web framework external module
var io = require("socket.io"); // web socket external module

var easyrtc = require("easyrtc"); // EasyRTC internal module

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();
httpApp.use(express.static(__dirname + "/static/"));

httpApp.get('/:room', (req, res, next) => {
    res.type('html');
    res.sendFile(__dirname + '/static/room.html');
});

// Start Express https server on port 8443
var webServer = https.createServer({
    key: fs.readFileSync(__dirname + "/certs/localhost.key"),
    cert: fs.readFileSync(__dirname + "/certs/localhost.crt")
}, httpApp);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {
    "log level": 1
});

// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, socketServer);

// Listen on port 8443
webServer.listen(8443, function () {
    console.log('listening on https://localhost:8443');
});