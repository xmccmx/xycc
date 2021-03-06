/*
* @全局方法
*/
var timer = null;
cc.Class({
    extends: cc.Component,

    properties: {

    },

    // use this for initialization
    onLoad: function () {
        this.clock = null;
    },
    //判断是否有初始化创建wjf全局变量
    ready: function () {
        var check = false;
        if (cc.weijifen) {
            check = true;
        } else {
            this.scene("login");
        }
        return check;
    },
    connect: function () {
        /**
         * 登录成功后，创建 Socket链接，
         */
        var self = this;
        this.disconnect();

        //cc.weijifen.socket = window.io.connect(cc.weijifen.http.wsURL + '/bm/game');
        cc.weijifen.socket = window.io.connect(cc.weijifen.http.wsURL, { 'reconnect': true });

        cc.weijifen.socket.ondisconnect = function () {
            console.log('user disconnected');
        };
        cc.weijifen.socket.on('connect_failed', function (data) {
            console.log("connect_failed to Server");
        });
        cc.weijifen.socket.on('connect_failed', function (data) {
            console.log("connect_failed to Server");
        });
        cc.weijifen.socket.on('error', function (data) {
            console.log("error");
        });
        cc.weijifen.socket.on('error', function (data) {
            console.log("error");
        });
        cc.weijifen.socket.on('reconnecting', function (data) {
            console.log("reconnecting");
        });
        cc.weijifen.socket.on('reconnect', function (data) {
            console.log("reconnect");
        });
        return cc.weijifen.socket;
    },
    disconnect: function () {
        if (cc.weijifen.socket != null) {
            cc.weijifen.socket.disconnect();
            cc.weijifen.socket = null;
        }
    },
    getCommon: function (common) {
        var object = cc.find("Canvas/script/" + common);
        return object.getComponent(common);
    },
    loadding: function () {
        let pre;
        if (cc.weijifen.loadding.size() > 0) {
            pre = cc.weijifen.loadding.get();
        } else {
            cc.loader.loadRes('prefab/general/loading', cc.Prefab, function (err, suc) {
                if (suc) {
                    pre = suc;
                }
                if (err) {
                    console.log(err);
                }
            })
        }
        if (pre == null) return;
        pre.parent = cc.find("Canvas");
        var _animCtrl = pre.children[1].getComponent(cc.Animation);
        _animCtrl.play("loadding");
    },
    /*
    * 提示框
    * @param messge 提示文字
    * @param matchFlag isStop倒计时停止，提示框消失的标志；isMatch“确定按钮消失”
    */
    alert: function (upmsg, midmsg, num, func1, func2) {
        if (cc.weijifen.alert.size() > 0) {
            this.alertdialog = cc.weijifen.alert.get();
            this.alertdialog.parent = cc.find("Canvas");
            let script = this.alertdialog.getComponent("Alert");
            script.init(upmsg, midmsg, num, func1, func2);
            this.alertdialog.zIndex = 30000;
        }
        return this.alertdialog;
    },
    closeloadding: function () {
        cc.weijifen.loadding.put(cc.find("Canvas/loadding"));
    },
    closealert: function () {
        if (cc.find("Canvas/alert")) {
            cc.weijifen.dialog.put(cc.find("Canvas/alert"));
        }
    },
    scene: function (name) {
        cc.weijifen.wjf.loadding();
        cc.director.preloadScene(name, function () {
            if (cc.weijifen) {
                cc.weijifen.wjf.closeloadding();
            }
            cc.director.loadScene(name);
        });
    },
    root: function () {
        return cc.find("Canvas");
    },
    decode: function (data) {
        var cards = new Array();
        if (!cc.sys.isNative) {
            var dataView = new DataView(data);
            for (var i = 0; i < data.byteLength; i++) {
                cards[i] = dataView.getInt8(i);
            }
        } else {
            var Base64 = require("Base64");
            var strArray = Base64.decode(data);
            if (strArray && strArray.length > 0) {
                for (var i = 0; i < strArray.length; i++) {
                    cards[i] = strArray[i];
                }
            }
        }
        return cards;
    },
    parse(result) {
        var data;
        if (!cc.sys.isNative) {
            data = result;
        } else {
            data = JSON.parse(result);
        }
        return data;
    },
    reset: function (data, result) {
        //放在全局变量
        if (data.token) {
            if (data.token.id) {
                cc.weijifen.authorization = data.token.id;
            } else {
                cc.weijifen.authorization = data.token;
            }
        };

        if (data.data) {
            cc.weijifen.user = data.data;
            data.data.gender == 2 ? cc.weijifen.genders['current'] = 'w' : cc.weijifen.genders['current'] = 'm';// 网页端测试
        }
        if (data.playUser) {
            cc.weijifen.user = data.playUser;
        }

        if (data.game) {
            cc.weijifen.games = data.games;
        }
        cc.weijifen.playway = null;
        cc.sys.localStorage.setItem("userinfo", result)
    },
    logout: function () {//断开socket并且销毁已有alert，同时初始化token、user、games、playway
        if (cc.weijifen.dialog != null) {
            cc.weijifen.dialog.destroy();
            cc.weijifen.dialog = null;
        }
        cc.weijifen.authorization = null;
        cc.weijifen.user = null;
        cc.weijifen.games = null;

        cc.weijifen.playway = null;

        this.disconnect();
    },
    socket: function () {
        let socket = cc.weijifen.socket;
        if (socket == null) {
            socket = this.connect();
        }
        return socket;
    },
    map: function (command, callback, self) {//添加路由函数
        self.routes[command] = callback || function () { };
    },
    /*
    * @param self MJDataBind.js节点
    */
    route: function (command, self) {
        return self.routes[command] || function () { };
    },
    talkPlay: function () { },
    talkRecord: function () { },
    ab2str: function (buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    },
    str2ab: function (str) {
        var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    },
    getGame: function (data, room) {//玩家进入房间是游戏场景初始化游戏信息
        if (data.match) {
            cc.weijifen.match = data.match;
        }
        if (data.room) {
            cc.weijifen.room = data.room;
        } else if (room) {
            cc.weijifen.room = data.room;
        }
        if (data.playway) {
            cc.weijifen.playway = data.playway;
        }
        if (data.playerNum) {
            cc.weijifen.playerNum = data.playerNum;
        }
        if (data.cardNum) {
            cc.weijifen.cardNum = data.cardNum;
        }
        if (data.maxRound) {
            cc.weijifen.maxRound = data.maxRound;
        } else if (data.maxRound == 0) {
            cc.weijifen.maxRound = 1;
        }
    },
    /**
     * 加载玩家头像
     * @param  {[cc.Node]} img 头像精灵图
     * @param  {[String]}  pic 图片路径
     * @param  {[Boolean]} bol 图片是否显示圆角
     */
    headImg: function (img, pic, bol, big) {
        if (pic) {
            let imgurl = pic;
            let sprite = img.getComponent(cc.Sprite);
            cc.loader.load({ url: imgurl, type: 'jpg' }, function (err, texture) {
                sprite.spriteFrame = new cc.SpriteFrame(texture);
                if (big) {
                    img.width = 110;
                    img.height = 110;
                } else {
                    img.width = 64;
                    img.height = 64;
                }
                if (bol == true) {
                    img.radius = 10;
                }
            })
        }
    },
    //点击打开弹窗
    hall: function (num, url) {
        if (num == 90) {
            this.alert('敬请期待！');
            return
        }
        let menu = cc.weijifen.menu.get();//拿到公用弹框PreFab
        let single = menu.getComponent('menuSet');//获取当前PreFab中名字为menuSet  js文件
        menu.parent = cc.find('Canvas');// 将节点放在Canvas节点下面。
        menu.zIndex = 2;
        single.init(num, url);//调用js文件中的init方法
    },
    wrong: function () {
        let menu = cc.find("Canvas/menu");// 在cocos对象下找到menu节点
        cc.weijifen.menu.put(menu);
    },
    /*阻止点击冒泡*/
    stopBubble: function (event) {
        event.bubble = false;
    },
    /*
  * 比赛倒计时
  * @param matchStartTime 距离比赛开始的毫秒数
  */
    countDown: function (matchStartTime) {
        let times = parseInt(matchStartTime / 1000);
        let msg;
        var day = 0,
            hour = 0,
            minute = 0,
            second = 0;//时间默认值
        // 直接显示在玩法框中
        let wanfa = cc.find('Canvas/rulesBg').getChildByName('label').getComponent(cc.Label);
        let a = setInterval(function () {
            if (times > 1) {
                day = Math.floor(times / (60 * 60 * 24));
                hour = Math.floor(times / (60 * 60)) - (day * 24);
                minute = Math.floor(times / 60) - (day * 24 * 60) - (hour * 60);
                second = Math.floor(times) - (day * 24 * 60 * 60) - (hour * 60 * 60) - (minute * 60);
                times--;
                cc.weijifen.matchTime = times * 1000;
                if (minute <= 9) minute = '0' + minute;
                if (second <= 9) second = '0' + second;
                msg = `距比赛开始：${minute}分${second}秒`;
                cc.sys.localStorage.setItem('matchTime', times * 1000)
                wanfa.string = msg;
            } else {
                wanfa.string = '等待比赛开始' || cc.weijifen.wanfa;
                cc.sys.localStorage.setItem('timeIsClose', 'true');
                cc.sys.localStorage.removeItem('matchTime');
                cc.sys.localStorage.removeItem('appTime');
                clearInterval(a);
                return
            }
        }, 1000);
    },
    /* 运行平台判断 */
    clientPlatForm: function () {
        if (cc.sys.os == cc.sys.OS_IOS) { return 'IOS' }
        if (cc.sys.os == cc.sys.OS_ANDROID) { return 'ANDROID' }
    },
    /* 
    * 一、调用android方法的参数 
    * 【
    *   index          description
    *   0              java类名
    *   1              java方法名
    *   2              方法签名
    * 】
    * 详情参考：http://docs.cocos.com/creator/manual/zh/advanced-topics/java-reflection.html
    */
    anMethodParam: function () {
        let anMethod, platForm;
        platForm = this.clientPlatForm();
        if (platForm == 'IOS') {
            // if (cc.weijifen.GameBase.gameModel == 'ch') {
            anMethod = {
                wxLogin: ["AppController", "wxLogin:", "cocos2d-js"],// 登录
                shareEvent: ["AppController", "shareEvent:"],// 去分享房间号、app、红包  
                shareParam: ["AppController", "shareParam:"],// 点击分享房间号 
                iPayHandler: ["AppController", "iPayHandler:"],// 支付 
                openView: ["AppController", "openView:"],  // 下载app 
                recorderApi: ["AppController", "recorderApi:"],  // 语音 
                getLocation: ['AppController', 'canGetPositions:'],//ios、gps
            }
            // }s
        } else if (platForm == 'ANDROID') {
            // if (cc.weijifen.GameBase.gameModel == 'ch') {
            var com = ["org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;"];
            anMethod = {
                wxLogin: [...com, "WXLoginOK", "1"],// 登录
                shareEvent: [...com, "shareEvent"],// 去分享房间号、app、红包  
                shareParam: [...com, "shareParam"],// 点击分享房间号 
                iPayHandler: [...com, "iPayHandler"],// 支付 
                openView: [...com, "openView"],// 下载app 
                recorderApi: [...com, "recorderApi"],// 录音 

            }
            // }
        } else {// 测试平台
            var com = ["org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;"];
            anMethod = {
                wxLogin: [...com, "WXLoginOK", "1"],// 登录
                shareEvent: [...com, "shareEvent"],// 去分享房间号、app、红包  
                shareParam: [...com, "shareParam", ""],// 点击分享房间号 
                iPayHandler: [...com, "iPayHandler"],// 支付 
                openView: [...com, "openView"],// 下载app 
                recorderApi: [...com, "recorderApi"],// 录音 

            }
        }
        return anMethod;
    },
    /*
    * 时间转换（时间戳->xxxx-xx-xx xx:xx:xx）
    * @param  [Number]  timestamp   时间戳
    * @param  [Number]  type        返回格式(1：年月日时分秒；2：月日)
    * return  [String]  eg:2018-01-01 01:01:01
    */
    timestampToTime: function (timestamp, type) {
        var Y, M, D, h, m, s;
        var date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        Y = date.getFullYear() + '-';
        M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        D = date.getDate() + ' ';
        h = date.getHours();
        m = date.getMinutes();
        s = date.getSeconds();
        if (D < 10) { D = '0' + D };
        if (h < 10) { h = '0' + h };
        if (m < 10) { m = '0' + m };
        if (s < 10) { s = '0' + s };
        if (type == 1 || type == undefined) {
            return Y + M + D + h + ':' + m + ':' + s;
        } else if (type == 2) {
            return M + D;
        }
    }
});

