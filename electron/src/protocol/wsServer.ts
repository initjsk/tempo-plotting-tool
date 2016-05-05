import {Point} from "../plot/Point"

var WebSocketServer = require('websocket').server;
var http = require('http');
 
export class WsServer {
    ip : String;
    port : Number;
    onIncoming: Function;
    
    constructor(ip : String, port : Number) {
        this.ip = ip;
        this.port = port;
    }
    
    initialize() {
        var self = this;
        
        var server = http.createServer(function(request : any, response : any) {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });
        server.listen(this.port, function() {
            console.log((new Date()) + ' Server is listening on port 8080');
        });
        
        var wsServer = new WebSocketServer({
            httpServer: server,
            // You should not use autoAcceptConnections for production 
            // applications, as it defeats all standard cross-origin protection 
            // facilities built into the protocol and the browser.  You should 
            // *always* verify the connection's origin and decide whether or not 
            // to accept it. 
            autoAcceptConnections: false
        });
        
        wsServer.on('request', function(request : any) {
            if (!WsServer.originIsAllowed(request.origin)) {
                // Make sure we only accept requests from an allowed origin 
                request.reject();
                console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                return;
            }
            
            var connection = request.accept('', request.origin);
            
            console.log((new Date()) + ' Connection accepted.');
            
            connection.on('message', function(message : any) {
                
                
                if (message.type === 'utf8') {
                    // Send message to PlotController
                    if(self.onIncoming != null){
                        var point : Point = SerializationHelper.toInstance(new Point(),message.utf8Data);
                        self.onIncoming(point.x,point.y);
                        console.log('Received Message: ' + point);
                    }
                    
                    console.log('Received Message: ' + message.utf8Data);
                    connection.sendUTF(message.utf8Data);
                }
                else if (message.type === 'binary') {
                    console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                    connection.sendBytes(message.binaryData);
                }
            });
            
            connection.on('close', function(reasonCode : any, description : any) {
                console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
            });
        });
    }
    
    setOnMessage(callback : Function) {
        this.onIncoming = callback;
    }
    
    static originIsAllowed(origin : any) {
        return true;
    }
}

class SerializationHelper {
    static toInstance<T>(obj: T, json: string): T {
        var jsonObj = JSON.parse(json);

        if (typeof (<any>obj)["fromJSON"] === "function") {
             (<any>obj)["fromJSON"](jsonObj);
        }
        else {
            for (var propName in jsonObj) {
                 (<any>obj)[propName] = jsonObj[propName]
            }
        }

        return obj;
    }
}