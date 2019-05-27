// Global Variables

let size = {x: 0, y: 0}
let total_size = {x: 0, y: 0}
let start_pos = {x: 0, y: 0}

let canvas_code = "";

let clients = []


function translatePoint(pos) {
    return {x: pos.x - start_pos.x, y: pos.y - start_pos.y};
}

function showToolbox() {
    document.getElementById("toolbox").hidden = false
}

function closeToolbox() {
    document.getElementById("toolbox").hidden = true
}

function openOptions() {
    document.getElementById("options").hidden = false
}

function closeOptions() {
    document.getElementById("options").hidden = true
}

function start() {
    document.getElementById("landing").remove();
    document.body.style.background = "none";

    sc.add({request: "create_canvas"}, (data) => {
        if (!data.message) {
            var code = document.createElement("h1");
            code.appendChild(document.createTextNode("Canvas Join Code: " + data.canvas));
            code.className += "element";
            document.body.appendChild(code);

            canvas_code = data.canvas

            var start = document.createElement("button");
            start.innerHTML = "Start"
            start.className += "element start";
            start.style.right = "5%";
            start.style.width = "10%";
            start.onclick = () => {
                sc.add({request: 'send_to_canvas', canvas: canvas_code, message: {'header': 'start'}})
                const removeElements = (elms) => elms.forEach(el => el.remove());
                removeElements( document.querySelectorAll(".start") );
                
                document.getElementById("toolbox-btn").hidden = false
            }

            document.body.appendChild(start)
        } else {
            if (data.message.header == "new_client") {
                clients.push({size: data.message.size, start_pos: data.message.start_pos, user_id: data.message.user_id})
                console.log(clients)

                const removeElements = (elms) => elms.forEach(el => el.remove());
                removeElements( document.querySelectorAll(".client") );

                for (let client of clients) {
                    let clientNode = document.createElement("div")
                    clientNode.className += "element client"
                    clientNode.appendChild(document.createTextNode(client.user_id));
                    clientNode.style.top = (client.start_pos.y / (data.message.total_size.y)) * 90 + 10 + "%"
                    clientNode.style.left = (client.start_pos.x / data.message.total_size.x) * 100 + "%"
                    clientNode.style.width = (client.size.x / data.message.total_size.x) * 100 + "%"
                    clientNode.style.height = (client.size.y / (data.message.total_size.y)) * 90 + "%"
                    clientNode.style.backgroundColor = "rgb(208, 0, 0)"
                    clientNode.style.border = "3px solid black"
                    clientNode.style.fontSize = "3em"

                    document.body.appendChild(clientNode)
                }

                total_size = data.message.total_size
            }
        }
    })
}

function join() {
    let codeNode = document.getElementById("code");
    let codeVal = codeNode.value

    size = {x: innerWidth, y: innerHeight}

    sc.add({request: "join_canvas", canvas: codeVal, size: size}, (data) => {
        console.log(data)
        if (!data.error) {
            if (!data.message) {
                document.getElementById("landing").remove();
                document.body.style.background = "none";
                var code = document.createElement("h1");
                code.appendChild(document.createTextNode(data.user_id));
                code.className += "element start"
                code.style.fontSize = "10em"
                code.style.width = "100%"
                code.style.textAlign = "center"
                document.body.appendChild(code);

                canvas_code = codeVal
                start_pos = data.start_pos
            } else {
                if (data.message.header == "new_client") {
                    clients.push({size: data.message.size, start_pos: data.message.start_pos, user_id: data.message.user_id})
                    total_size = data.message.total_size
                } else if (data.message.header == "start") {
                    const removeElements = (elms) => elms.forEach(el => el.remove());
                    removeElements( document.querySelectorAll(".start") );
                    document.getElementById("toolbox-btn").hidden = false
                }
            }
        }
    })
}

// WebSocket server connection API

var CONNURL = "ws://10.0.1.72:9001"

var ServerconnService = /** @class */ (function () {
    function ServerconnService() {
        this._callbacks = [];
        this._caches = [];
        this.openCallbacks = [function () { }];
        this._initialize();
    }
    ServerconnService.prototype._check = function () {
        if (!this._ws || this._ws.readyState == 3) {
            this._initialize();
        }
    };
    ServerconnService.prototype._initialize = function () {
        var _this = this;
        this._ws = new WebSocket(CONNURL);
        this._ws.onmessage = function (e) {
            var data = JSON.parse(e.data);
            _this._callbacks.forEach(function (callback) {
                if (data.response_id === callback[0]) {
                    if (data.error) {
                        alert(data.error);
                    }
                    callback[1](data);
                }
            });
        };
        this._ws.onerror = function (e) {
            _this._check();
        };
        this._ws.onclose = function (e) {
            _this._check();
        };
        this._ws.onopen = function (e) {
            for (var _i = 0, _a = _this.openCallbacks; _i < _a.length; _i++) {
                var callback = _a[_i];
                callback();
            }
            _this._caches.forEach(function (element) {
                _this._ws.send(element);
            });
        };
    };
    ServerconnService.prototype.add = function (data, callback) {
        var identifier = this._generateIdentifier();
        data.request_id = identifier;
        this._callbacks.push([identifier, callback]);
        if (this._ws.readyState == this._ws.OPEN) {
            this._ws.send(JSON.stringify(data));
        }
        else {
            this._caches.push(JSON.stringify(data));
        }
    };
    ServerconnService.prototype._generateIdentifier = function () {
        return uuidv4();
    };
    return ServerconnService;
}());
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

var sc = new ServerconnService();