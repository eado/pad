var CONNURL = "wss://server.thelemonayd.com:8123"

// Global Variables

let size = {x: 0, y: 0}
let total_size = {x: 0, y: 0}
let start_pos = {x: 0, y: 0}
let user_id = "";

let canvas_code = "";

let clients = []

let addTo = "center"
let sizing = "intrinsic"

let maxZIndex = 10

let objects = []

let globalPlayer;

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    globalPlayer = new YT.Player('ytplayer', {
      height: '390',
      width: '640',
      videoId: 'M7lc1UVf-VE'
    });
    document.getElementById("ytplayer").hidden = true
    objects.push({element: document.getElementById("ytplayer"), touches: []})
}

function reload() {
    location = location
}


function translatePoint(pos) {
    return {x: pos.x - start_pos.x, y: pos.y - start_pos.y};
}

function deTranslatePoint(pos) {
    return {x: pos.x + start_pos.x, y: pos.y + start_pos.y}
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

function ytOpen() {
    document.getElementById("yttoolbox").hidden = false
}

function ytClose() {
    document.getElementById("yttoolbox").hidden = true
}

function setAdd(string) {
    if (string == "center") {
        document.getElementById("center").className = " btn-inverse"
        document.getElementById("user").className = " btn"

        addTo = "center"
    } else if (string == "user") {
        document.getElementById("user").className = " btn-inverse"
        document.getElementById("center").className = " btn"

        addTo = "user"
    } else if (string == "intrinsic") {
        document.getElementById("intrinsic").className = " btn-inverse"
        document.getElementById("full").className = " btn"
        document.getElementById("device").className = " btn"

        sizing = "intrinsic"
    } else if (string == "full") {
        document.getElementById("full").className = " btn-inverse"
        document.getElementById("intrinsic").className = " btn"
        document.getElementById("device").className = " btn"

        sizing = "full"
    } else if (string == "device") {
        document.getElementById("device").className = "btn-inverse"
        document.getElementById("full").className = "btn"
        document.getElementById("intrinsic").className = "btn"

        sizing = "device"
    }
}

function getAddPosition() {
    if (addTo == "center") {
        return {x: total_size.x / 2, y: total_size.y / 2};
    } else {
        for (let user of clients) {
            if (user.user_id == document.getElementById("userin").value) {
                return user.start_pos
            }
        }

        return start_pos;
    }
}

function addCards() {
    sc.add({request: "send_to_canvas", canvas: canvas_code, message: 
        {
            header: "add",
            type: "deck",
            pos: getAddPosition()
        }
    })
}

function addYT() {
    sc.add({request: "send_to_canvas", canvas: canvas_code, message: 
        {
            header: "add",
            type: "yt",
            pos: getAddPosition(),
            ytid: document.getElementById("ytid").value,
        }
    })
}

function ytSet(set) {
    let message = {
        header: "yt",
        set: set,
        num: 0,
        timestamp: Date.now()
    }
    if (set == "seek") {
        message.num = document.getElementById("ytseekin").value
    }
    sc.add({request: "send_to_canvas", canvas: canvas_code, message: message})
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

                const removeElements = (elms) => elms.forEach(el => el.remove());
                removeElements( document.querySelectorAll(".client") );

                for (let client of clients) {
                    let clientNode = document.createElement("div")
                    clientNode.className += "element client"
                    clientNode.style.boxSizing = "border-box";
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

                user_id = data.user_id
            } else {
                if (data.message.header == "new_client") {
                    clients.push({size: data.message.size, start_pos: data.message.start_pos, user_id: data.message.user_id})
                    total_size = data.message.total_size
                } else if (data.message.header == "start") {
                    const removeElements = (elms) => elms.forEach(el => el.remove());
                    removeElements( document.querySelectorAll(".start") );
                    document.getElementById("toolbox-btn").hidden = false

                    document.getElementById("toolbox-btn").innerHTML += " " + user_id

                    document.body.addEventListener("mousedown", (evt) => { mouseevent("down", evt) })
                    // document.body.addEventListener("mouseover", (evt) => { mouseevent("down", evt) })  
                    document.body.addEventListener("mousemove", (evt) => { mouseevent("move", evt) })
                    document.body.addEventListener("mouseup", (evt) => { mouseevent("up", evt) })
                    document.body.addEventListener("mouseout", (evt) => { mouseevent("up", evt) })
                    document.addEventListener("touchstart", (evt) => { touchevent("down", evt) })
                    document.addEventListener("touchmove", (evt) => { touchevent("move", evt) })
                    document.addEventListener("touchend", (evt) => { touchevent("up", evt) })
                    document.addEventListener("touchcancel", (evt) => { touchevent("up", evt) })

                } else if (data.message.header == "add") {
                    if (data.message.type == "deck") {
                        let suits = ['clovers', 'hearts', 'spades', 'diamonds']

                        let index = 0;
                        for (let suit of suits) {
                            for (let i = 1; i <= 13; i++) {
                                let imageNode = document.createElement("img")
                                imageNode.src = "static/cardimgs/" + suit + "-" + i + ".png"
                                imageNode.className += "element celement"

                                imageNode.id = uuidv4()
                                
                                imageNode.style.top = translatePoint(data.message.pos).y + index + "px"
                                imageNode.style.left = translatePoint(data.message.pos).x + index + "px"

                                document.body.appendChild(imageNode)
                                
                                objects.push({element: imageNode, touches: []})
                                

                                index += 10;
                            }
                        }
                    } else if (data.message.type == "yt") {
                        let playerNode = document.getElementById("ytplayer")

                        playerNode.style.top = translatePoint({x: 0, y: 0}).y + "px"; 
                        playerNode.style.left = translatePoint({x: 0, y: 0}).x + "px";

                        playerNode.width = total_size.x
                        playerNode.height = total_size.y

                        globalPlayer.loadVideoById(data.message.ytid, 0)
                        setTimeout(() => {
                            globalPlayer.pauseVideo()
                        }, 1000)

                        playerNode.hidden = false
                    }
                } else if (data.message.header == "yt") {
                    if (data.message.set == "play") {
                        setInterval(() => {
                            console.log("hello")
                            console.log(data.message.timestamp)
                            console.log(Date.now())
                            if (data.message.timestamp + 1000 <= Date.now()) {
                                
                                globalPlayer.playVideo()
                            }
                        }, 1)
                    } else if (data.message.set == "stop") {
                        globalPlayer.pauseVideo()
                    } else if (data.message.set == "seek") {
                        globalPlayer.seekTo(Number(data.message.num))
                    }
                } else if (data.message.header == "touch_down") {
                    let pos = translatePoint(data.message.pos);
                    for (let object of objects.reverse()) {
                        let element = object.element

                        if (pos.x >= element.offsetLeft && pos.x <= (element.offsetLeft + element.width) &&
                            pos.y >= element.offsetTop && pos.y <= (element.offsetTop + element.height)) {
                                let initialAngle = 0
                                if (object.touches.length > 1) {
                                    let touch1 = object.touches[0]
                                    let touch2 = object.touches[1]
                                    initialAngle = (Math.atan((touch2.y - touch1.y) / (touch2.x - touch1.x)) * 180 / Math.PI)
                                }
                                object.touches.push({
                                        touch_id: data.message.touch_id,
                                        offsetPos: {x: pos.x - element.offsetLeft, y: pos.y - element.offsetTop},
                                        pos: deTranslatePoint(pos),
                                        initialPos: deTranslatePoint(pos),
                                        initialSize: element.getBoundingClientRect(),
                                        initialOffset: {x: pos.x - element.offsetLeft, y: pos.y - element.offsetTop},
                                        lastPos: deTranslatePoint(pos),
                                        posIndex: 0,
                                        initialAngle: initialAngle
                                })
                                element.style.zIndex = maxZIndex
                                maxZIndex += 1;
                                return
                        }
                    }
                } else if (data.message.header == "touch_move") {
                    let pos = translatePoint(data.message.pos);
                    for (let object of objects) {
                        let element = object.element

                        for (let touch of object.touches) {
                            if (touch.touch_id == data.message.touch_id) {
                                if (touch.posIndex > 1) {
                                    touch.lastPos = touch.pos
                                    touch.posIndex = 0
                                }
                                touch.pos = deTranslatePoint(pos)
                                touch.posIndex += 1
                            }
                        }
                        if (object.touches.length > 1) {
                            let touch1 = translatePoint(object.touches[0].pos)
                            let touch2 = translatePoint(object.touches[1].pos)
                            let itouch1 = translatePoint(object.touches[0].initialPos)
                            let itouch2 = translatePoint(object.touches[1].initialPos)
                            let offset1 = object.touches[0].offsetPos
                            let offset2 = object.touches[1].offsetPos

                            console.log(touch1)
                            console.log(touch2)
                            console.log(itouch1)
                            console.log(itouch2)
                            console.log(offset1)
                            console.log(offset2)

                            let cpos = {x: (touch1.x + touch2.x) / 2, y: (touch1.y + touch2.y) / 2}
                            let coffset = {x: (offset1.x + offset2.x) / 2, y: (offset1.y + offset2.y) / 2}

                            let dpos = Math.sqrt(Math.pow(touch1.x - touch2.x, 2) + Math.pow(touch1.y - touch2.y, 2))
                            let dipos = Math.sqrt(Math.pow(itouch1.x - itouch2.x, 2) + Math.pow(itouch1.y - itouch2.y, 2))

                            

                            console.log(dpos)
                            console.log(dipos)

                            let ratio = dpos / dipos

                            console.log(ratio)

                            console.log(object.touches[0].initialSize)

                            element.width = object.touches[0].initialSize.width * ratio
                            element.height = object.touches[0].initialSize.height * ratio

                            element.style.left = cpos.x - (coffset.x * ratio) + "px";
                            element.style.top = cpos.y - (coffset.y * ratio)+ "px";

                            element.style.transform = "rotate(" + ((Math.atan((touch2.y - touch1.y) / (touch2.x - touch1.x)) * 180 / Math.PI) - object.touches[0].initialAngle) + "deg)"

                            // offset1.x = object.touches[0].initialOffset.x * ratio
                            // offset1.y = object.touches[0].initialOffset.y * ratio
                            // offset2.x = object.touches[1].initialOffset.x * ratio
                            // offset2.y = object.touches[1].initialOffset.y * ratio

                        }
                        if (object.touches.length == 1) {
                            for (let touch of object.touches) {
                                if (touch.touch_id == data.message.touch_id) {
                                    element.style.left = pos.x - touch.offsetPos.x + "px";
                                    element.style.top = pos.y - touch.offsetPos.y + "px";
                                }
                            }
                        }
                    }
                } else if (data.message.header == "touch_up") {
                    for (let object of objects) {
                        let touch = object.touches[0]
                        object.touches = object.touches.filter(item => item.touch_id !== data.message.touch_id)

                        // if (object.touches.length < 1 && touch != undefined) {
                        //     let distx = (touch.pos.x - touch.lastPos.x) * 0.8
                        //     let disty = (touch.pos.y - touch.lastPos.y) * 0.8

                        //     let disabled = false
                        //     let disabledx = false
                        //     let disabledy = false
                        //     setInterval(() => {
                        //         if (object.touches.length < 1 && !disabled) {
                        //             if (!disabledx) {
                        //                 object.element.style.left = (object.element.offsetLeft + distx) + "px"
                        //                 console.log(distx)
                        //                 if (object.offsetLeft <= 0 || object.offsetLeft >= total_size.x) {
                        //                     distx = -distx
                        //                 }
                        //                 if (distx > 0) {
                        //                     distx -= 2
                        //                     if (distx < 0) {
                        //                         disabledx = true
                        //                     }
                        //                 } else {
                        //                     distx += 2
                        //                     if (distx > 0) {
                        //                         disabledx = true
                        //                     }
                        //                 }
                        //             }
                        //             if (!disabledy) {
                        //                 console.log(disty)
                        //                 object.element.style.top = (object.element.offsetTop + disty) + "px"
                        //                 if (object.offsetTop <= 0 || object.offsetTop >= total_size.y) {
                        //                     disty = -disty
                        //                 }
                        //                 if (disty > 0) {
                        //                     disty -= 2
                        //                     if (disty < 0) {
                        //                         disabledy = true
                        //                     }
                        //                 } else {
                        //                     disty += 2
                        //                     if (disty > 0) {
                        //                         disabledy = true
                        //                     }
                        //                 }
                        //             }
                        //         } else {
                        //             disabled = true;
                        //         }
                        //     }, 10)
                        // }
                    }
                }
            }
        }
    })
} 

let mouseID = uuidv4()

function mouseevent(type, evt) {
    if (document.getElementById("toolbox").hidden) {
        evt.preventDefault();
        sc.add({
            request: "send_to_canvas", 
            canvas: canvas_code, 
            message: {
                header: "touch_" + type, 
                pos: deTranslatePoint({x: evt.clientX, y: evt.clientY}),
                touch_id: mouseID
            }
        }) 
    }
}

function touchevent(type, evt) {
    if (document.getElementById("toolbox").hidden) {
        // evt.preventDefault();

        for (let touch of evt.changedTouches) {
            sc.add({
                request: "send_to_canvas", 
                canvas: canvas_code, 
                message: {
                    header: "touch_" + type, 
                    pos: deTranslatePoint({x: touch.clientX, y: touch.clientY}),
                    touch_id: touch.identifier
                }
            }) 
        }
    }
}

// WebSocket server connection API

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