//获取桌面进程的对象
const { desktopCapturer } = require('electron')
const { ipcRenderer } = require('electron')
var fs = require('fs');

class Luping {

    /**
     *默认配置 defaultoptions
     *
     * @type {{}}
     */
    d = {
        startStr: "开始录制视频",
        onVideo: "正在录制视频...",
        stopStr: "停止录制视频"
    }

    el = $("body")

    /**
     *视图view
     * @type {{}}
     */
    v = {
        el: this.el,
        start: this.el.find("#start"),
        stop: this.el.find("#stop")
    }

    /**
     * 模块model
     * @type {{}}
     */
    m = {
        desktop_id: null,
        desktopSharing: false,
        localStream: null,
        blobArrs: []
    }


    constructor(opts) {
        this.d = { ...this.d, ...opts }
        this.init()
    }


    init() {
        //初始化数据
        this.initDate.init()
        //初始化事件
        this.initEvents.init()

    }

    initDate = {
        init: () => {

        }
    }

    initEvents = {
        init: () => {
            this.initEvents.startEvent();
            this.initEvents.endEvent();

        },
        startEvent: () => {
            this.v.start.on("click", (e) => {
                this.fn.start()
            })
        },
        endEvent: () => {
            this.v.stop.on("click", (e) => {
                this.fn.stop()
            })
        }
    }

    fn = {
        start: () => {
            //如果还未监控
            if (!this.m.desktopSharing) {
                this.v.start.attr("disabled", true)
                this.v.start.css("color", "red")
                this.m.desktopSharing = true;
                this.fn.showSources();
            } else {
                alert("视频还在处理...")
            }

        },
        stop: () => {
            if (this.m.localStream) {
                this.m.localStream.getTracks()[0].stop();
            }
            this.m.localStream = null;
        },
        //获取当前主屏幕-->回调录屏(onAccessApproved)-->回调获取流(gotStream)
        showSources: () => {
            //同步:then(sources =>{}) 异步:then(async sources =>{}) 这里要使用同步,不然无法获取this
            desktopCapturer.getSources({ types: ['window', 'screen'] }).then(sources => {
                    //获取所有的桌面并打印
                    for (let source of sources) {
                        console.log('Name: ' + source.name)
                    }
                    //只录取主视频 的 ID
                    this.m.desktop_id = sources[0].id.replace(':', '')
                    this.fn.onAccessApproved();
                }
            )

        },
        //回调录屏(onAccessApproved)-->回调获取流(gotStream)
        onAccessApproved: () => {
            if (!this.m.desktop_id) {
                alert("系统不允许录屏")
                return;
            }

            this.v.start.html(this.d.onVideo)
            var desktop_id = this.m.desktop_id;
            desktop_id = desktop_id.replace(/window|screen/g, function (match) {
                return match + ':'
            })
            navigator.webkitGetUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: desktop_id,
                    }
                }
            }, this.fn.gotStream, this.fn.getUserMediaError)

        },
        //回调获取流(gotStream)-->监听streamend事件(streamEnd)
        //回调获取流(gotStream)-->监听视频流分片事件(blobEventCall)
        gotStream: (stream) => {
            this.m.localStream = stream
            //可做修改1:可以修改页面,在页面上实时播放录屏
            // let video = document.querySelector('video');
            // video.srcObject = stream;
            // video.onloadedmetadata = (e) =>video.play();
            var mediaRecorder = new MediaRecorder(stream)
            mediaRecorder.ondataavailable = this.fn.blobEventCall
            mediaRecorder.start(5000)
            //录屏结束的时候
            mediaRecorder.onstop = this.fn.streamEnd
        },
        streamEnd: (a) => {

            //向主进程发送保存文件指令
            ipcRenderer.send('save-dialog')
            //监听点击保存之后的指令
            ipcRenderer.on('saved-file', (event, result) => {
                if (result.canceled) {
                    //清空内存
                    luping.fn.clear()

                    return;
                }
                var fileReader = new FileReader();
                fileReader.readAsArrayBuffer(new Blob(luping.m.blobArrs))
                fileReader.onload = function () {
                    console.log(this.result)
                    var buffer = Buffer.from(this.result);
                    fs.writeFile(result.filePath, buffer, function (error) {
                        //清空内存
                        luping.fn.clear()
                        if (error) {
                            console.log('写入失败')
                        } else {
                            console.log('写入成功')
                        }
                    });
                }
            })
        },
        getUserMediaError: () => {
            console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'))
        },
        //监听视频流分片事件(blobEventCall)
        blobEventCall: (blobEvent) => {
            console.log(blobEvent)
            var blob = blobEvent.data;
            blob = new Blob([blob], { type: "video/x-msvideo;codecs=vp8" })
            luping.m.blobArrs.push(blob)

            //获取的是blobEvent.data的类型是Blob(二进制)

            //可做修改2:可以将视频传播通过http给后台
            // var formData = new FormData()
            // formData.append('file', 'blob.webm')  // 文件名
            // // JavaScript file-like 对象
            // formData.append('file', blobEvent.data)
            // var request = new XMLHttpRequest()
            // console.log('heloo')
            // request.responseType = 'blob'
            // request.open('POST', 'http://172.16.20.39:90/stock/upload')
            // request.send(formData)
        },
        //录屏完成
        clear: () => {
            luping.m.blobArrs = []
            luping.m.desktopSharing = false;
            $("#start").html(luping.d.startStr)
            this.v.start.attr("disabled", false)
            this.v.start.css("color", "black")
            this.m.desktopSharing = true;
        }

    }

}

let luping = new Luping();
