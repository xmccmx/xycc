// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
var WJFCommon = require("WJFCommon");
cc.Class({
    extends: WJFCommon,

    properties: {
        _btnNode: cc.Node,//存放多个btn节点的父节点
        _tipsNode: cc.Node,//存放多个提示框节点的父节点
        _cardTip: cc.Node,//余牌提示框
        _deskcardsNode: cc.Node,//4位玩家deskcardspanel的父节点
        _menuBtn: cc.Node,//菜单节点
        _playersNode: cc.Node,//默认头像框和ok手势父节点
        _actionMenu: cc.Node,//peng、gang、chi等节点的父节点
        _selectfather: cc.Node,//存在多种action牌型时，需要将所有可选择的牌型都呈现出来，这个就是显示panel的父节点
        _mjtimer: cc.Label,//牌桌中间的计时Label,同时是灯的父节点
        _chatMsg: cc.Node,//显示聊天信息的node
        _fangweiNode: cc.Node,//桌面中间的4个东南西北方位节点的父节点
        _ruleLabel: cc.Node,//显示玩法和比赛剩余时间的label
        _allHandCardNode: cc.Node,//4位玩家handcard的父节点
        handcardPrefab: cc.Prefab,
        setpanelPrefab: cc.Prefab,
        playerheadPrefab: cc.Prefab,
        menuPrefab: cc.Prefab,

    },
    onLoad() {
        let self = this;
        this.initPool();//初始化对象池
        this.initData();//初始化游戏数据
        this.addClickEvent();//添加点击事件
        var gameStartInit;
        if (cc.sys.localStorage.getItem('gotWsUrl') || cc.sys.localStorage.getItem('isPlay') || cc.weijifen.match == 'false' || cc.sys.localStorage.getItem('matchType') == 5) {
            var socket = this.connect();
            socket.on('connect', function () {
                self.playerIsReady(self);
                gameStartInit = cc.weijifen.gameStartInit;
                self.map("joinroom", cc.weijifen.roomInit.joinroom_event, self);//加入房间
                self.map("banker", gameStartInit.banker_event, self);//庄家
                self.map("players", gameStartInit.players_event, self);//接受玩家列表
                self.map("play", gameStartInit.play_event, self);//人齐了，接收发牌信息
                self.map("changeRoom", self.changeRoom_event, self);// 比赛
                self.map("talkOnSay", self.talk_event, self);//语音  文字   表情

                self.map("lasthands", cc.weijifen.gamePlay.lasthands_event, self);//庄家开始打牌了，允许出牌
                self.map("takecards", cc.weijifen.gamePlay.takecard_event, self);//我出的牌  
                self.map("dealcard", cc.weijifen.gamePlay.dealcard_event, self);                //我拿的牌

                self.map("action", cc.weijifen.gameEvent.action_event, self);//服务端发送的 动作事件，有杠碰吃胡过可以选择
                self.map("selectaction", cc.weijifen.gameEvent.selectaction_event, self);        //我选择的动作， 杠碰吃胡 


                self.map("allcards", cc.weijifen.gameEvent.allcards_event, self);
                self.map("isOver", cc.weijifen.settingClick.isOver_event, self);
                self.map("gameOver", cc.weijifen.settingClick.gameOver_event, self);
                self.map("over", cc.weijifen.settingClick.over_event, self);
                self.map("unOver", cc.weijifen.settingClick.unOver_event, self);

            });

            socket.on('quit_refresh', function (result) {
                if (result) {
                    var msg;
                    typeof result == 'object' ? msg = result : msg = JSON.parse(result);
                    var arr = ['left', 'right', 'top'];
                    for (var i = 0; i < arr.length; i++) {
                        if (msg.userId == cc.sys.localStorage.getItem(arr[i])) {
                            cc.sys.localStorage.removeItem(arr[i]);
                            var string = 'ok_' + arr[i];
                            var ok = cc.find('Canvas/players/' + string);
                            ok.active = false;
                        }
                    }
                    var counts = cc.sys.localStorage.getItem('count') - 1;
                    cc.sys.localStorage.setItem('count', counts)
                    cc.sys.localStorage.setItem('quitpeople', msg.userId);
                    var labels = self._tipsNode.getChildByName('playerExitTip');
                    for (var inx = 0; inx < self.playersarray.length; inx++) {
                        let temp = self.playersarray[inx].getComponent("MJPlayer");
                        if (temp.id.string == msg.userId) {
                            labels.getComponent(cc.Label).string = '玩家：' + temp.nameLabel.string + ' 离开了房间!';
                            var action = cc.moveTo(0.3, 0, -290);
                            labels.runAction(action);
                            var func = function () {
                                var action2 = cc.moveTo(0.3, 0, -400);
                                labels.runAction(action2);
                                self.unschedule(func);
                            }
                            self.schedule(func, 3.5, 1);
                            var copy = cc.instantiate(self.playersarray[inx]);
                            self.playerspool.put(self.playersarray[inx]);
                            self.playerspool.put(copy);
                            temp.node.destroy();
                            self.playersarray.splice(inx, 1);
                            break;
                        }
                    }
                }
            });
            socket.on("command", function (result) {
                var data;
                if (result == 'well') {
                    data = result;
                } else {
                    data = self.getSelf().parse(result);
                }
                if (data.replacePowerCard && data.action == 'ting') {
                    cc.find('Canvas/tip').active = true;
                    var timer;
                    timer = setTimeout(function () {
                        cc.find('Canvas/tip').active = false;
                        clearTimeout(timer);
                    }, 3000);
                }

                if (data.command == 'ComingToAnEnd') {
                    /**
                    * 比赛模式中，距离比赛结束30s时收到，并显示倒计时
                    */
                    let seconds = 30;
                    let str = self.wanfa.getComponent(cc.Label);
                    str.string = '距离比赛结束还有30秒';
                    let time = setInterval(function () {
                        seconds--;
                        str.string = '距离比赛结束还有' + seconds + '秒';
                        if (seconds < 1) {
                            self.prohibit_mask.active = true;
                            clearInterval(time);
                        }
                    }, 1000);
                    let mask_time = setTimeout(function () {
                        self.prohibit_mask.active = false;
                        clearTimeout(mask_time);
                    }, 5000);
                } else if (data != 'well') {
                    self.getSelf().route(data.command, self)(data, self);
                }
                if (cc.weijifen.match == 'true') {
                    // 网络心跳包
                    if (data == 'well') {
                        listenFlag = false;
                        hasAlert = false;
                        socket.emit("healthListen", '');
                    }
                }
            });

            if (cc.weijifen.match == 'true') {
                var listenTime = setInterval(function () {
                    if (cc.director.getScene().name == 'gameMain') {
                        clearInterval(listenTime);
                        return
                    }
                    if (hasAlert) { return };
                    listenFlag == false ? listenFlag = true : listenFlag = false;
                    // 若为false则为网络正常,true为网络出现正常
                    if (listenFlag == false && cc.weijifen.dialog.size() > 0) {
                        if (hasAlert) { return };
                        self.__proto__.__proto__.alert('当前网络环境较差！');
                        hasAlert = true;
                    } else if (listenFlag == true && cc.find('Canvas/alert') && cc.find('Canvas/alert').length < 6) {
                        cc.weijifen.dialog.put(cc.find('Canvas/alert'));
                    }
                }, 6000);
            }
            socket.on("play", function (result) {
                var data = self.getSelf().parse(result);
                self.getSelf().route('play', self)(data, self);
            })
            socket.on("takecards", function (result) {
                var data = self.getSelf().parse(result);
                data = JSON.parse(data);
                self.getSelf().route('takecards', self)(data, self);
                // 手牌缺少，出牌之后，牌面缺失查找缺失牌面，并进行补充
                let handcardnode = cc.find('Canvas/cards/handCards/current/handCards');
                if (data.userid == cc.weijifen.user.id && data.cards && data.cards.length != handcardnode.children.length) {
                    for (let i = 0; i < handcardnode.childrenCount; i++) {
                        let handcards = self.playercards[i].getComponent("HandCard");
                        handcards.csImageTop.active = false;
                        handcards.node.zIndex = 0;
                        handcards.node.getComponent(cc.Button).enabled = true;
                        handcards.cardvalue.color = new cc.Color(255, 255, 255);
                        handcards.reinit();
                        self.cardpool.put(self.playercards[i]);
                    }
                    handcardnode.removeAllChildren();
                    self.playercards = [];
                    for (var i = 0; i < data.cards.length; i++) {
                        if (self.cardpool) {
                            let temp = self.cardpool.get();
                            if (temp == undefined || temp == null) {
                                temp = cc.instantiate(self.handcardPrefab);
                            }
                            let temp_script = temp.getComponent("HandCard");
                            if (data.cards[i] >= 0) {
                                temp.zIndex = data.cards[i];
                            } else {
                                temp.zIndex = 200 + data.cards[i];
                            }
                            self.playercards.push(temp);
                            temp_script.init(data.cards[i]);
                            temp.parent = handcardnode;
                        }
                    }
                    handcardnode.sortAllChildren();
                }
            })

            socket.on("action", function (result) {
                var data = self.getSelf().parse(result);
                self.getSelf().route('action', self)(JSON.parse(data), self);
            })
            socket.on("allcards", function (result) {
                var data = self.getSelf().parse(result);
                self.getSelf().route('allcards', self)(JSON.parse(data), self);
            })
            /**
             * 接受传送的 玩家列表（含AI）
             */
            socket.on("players", function (result) {
                var data = self.getSelf().parse(result);
                self.getSelf().route("players", self)(data, self);
            });

            socket.on("talkOnSay", function (result) {
                var data = self.getSelf().parse(result);
                self.getSelf().route("talkOnSay", self)(data, self);
            });
            // 监听解散进程
            socket.on("overInfo", function (result) {
                var data;
                typeof result == 'object' ? data = result : data = JSON.parse(result);
                let alerts = cc.find('Canvas/alert');
                if (Number(data.refuseCount) > 0) {
                    if (alerts) {
                        var src = alerts.getComponent('Alert');
                        var list = src.list.children;
                        for (var i in data.refuseIds) {
                            for (var j = 1; j < list.length; j++) {
                                var ids = list[j].getChildByName('id').getComponent(cc.Label).string;
                                if (ids == data.refuseIds[i]) {
                                    list[j].getChildByName('ok').active = false;
                                    list[j].getChildByName('no').active = true;
                                    break;
                                }
                            }
                        }
                        src.upMsg.string = '有玩家拒绝解散，解散失败!';
                        src.true.active = true;
                        src.false.active = false;
                        src.true.x = 0;
                        src.list.y = 8;
                        src._funok = function () { cc.weijifen.alert.put(cc.find('Canvas/alert')); }
                        src.closeAlert(src);
                    }
                    return;
                }
                if (alerts) {
                    var src = alerts.getComponent('Alert');
                    var list = src.list.children;
                    for (var i in data.agreeIds) {
                        for (var j = 1; j < list.length; j++) {
                            var ids = list[j].getChildByName('id').getComponent(cc.Label).string;
                            if (ids == data.agreeIds[i]) {
                                list[j].getChildByName('no').active = false;
                                list[j].getChildByName('ok').active = true;
                                break;
                            }
                        }
                    }
                    src.upMsg.string = '解散中,请稍后...';
                }
                if (cc.weijifen.playerNum == (Number(data.overCount) + Number(data.refuseCount))) {
                    src.closeAlert(src);
                }
            })

            self.node.on('overGame', function (event) {
                let socket = self.getSelf().socket();
                if (event.getUserData()) {
                    socket.emit('overGame', JSON.stringify({
                        REFUSE: event.getUserData()
                    }))
                } else {
                    socket.emit('overGame', JSON.stringify({
                    }))
                }
            });

            self.node.on('readyGM', function (event) {
                self._playersNode.children[7].active = true;
                self._btnNode.getChildByName('readyBtn').active = false;
                self._btnNode.getChildByName('friendBtn').active = false;
                let socket = self.getSelf().socket();
                socket.emit('readyGame', JSON.stringify({
                }))
            });

            // 监听出牌拿牌
            self.node.on('takecard', function (event) {
                cc.sys.localStorage.removeItem('guo');
                cc.weijifen.audio.playSFX('select');
                if (cc.sys.localStorage.getItem('take') == 'true') {
                    let card_script = event.target.getComponent('HandCard');
                    if (card_script != null) {
                        cc.weijifen.gamePlay.takecard_event({ userid: cc.weijifen.user.id, card: card_script.value }, self);
                        /**
                          * 提交数据，等待服务器返回
                         */

                        //开始匹配
                        let socket = self.getSelf().socket();

                        if (cc.sys.localStorage.getItem('ting') == 'true') {
                            let src = cc.weijifen.gameStartInit.player(cc.weijifen.user.id, self);
                            src.ting.active = true;
                            var anim = cc.find("Canvas/animations");//听牌动画
                            anim.active = true;
                            anim.x = -450;
                            anim.y = -200;
                            var anims = anim.getComponent(cc.Animation);
                            anims.play('ting');
                            setTimeout(function () {
                                anim.active = false;
                                anims.stop('ting');
                            }, 2000);
                            var gameModelMp3 = '';
                            if (cc.weijifen.GameBase.gameModel == 'wz') gameModelMp3 = 'wz';
                            cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + 'ting' + '_' + cc.weijifen.genders['current']);
                            let socket = self.getSelf().socket();
                            cc.sys.localStorage.removeItem('ting');
                            socket.emit("selectaction", JSON.stringify({
                                action: "ting",
                                actionCard: [card_script.value]
                            }));
                            self.getSelf().tingAction();
                            cc.find('Canvas/cards/handCards/banHandcardClick').active = true;
                        } else {
                            socket.emit("doplaycards", card_script.value);
                        }
                    }
                    event.stopPropagation();
                }
            });


            self.node.on('mjSelection', function (event) {
                let father = self._selectfather;
                father.active = false;
                father.children[0].children[1].children.length = 0;
                let socket = self.getSelf().socket();
                let params = [];
                let sendEvent;
                if (event.getUserData()) {
                    sendEvent = event.getUserData().name;
                    params = event.getUserData().params;
                }
                socket.emit("selectaction", JSON.stringify({
                    action: sendEvent,
                    actionCard: params
                }));
                self.getSelf().showAtionMenu();
                event.stopPropagation();
            });
            /**
             * ActionEvent发射的事件 ， 点击 碰
             */
            self.node.on("peng", function (event) {
                cc.sys.localStorage.removeItem('guo');
                let socket = self.getSelf().socket();
                socket.emit("selectaction", JSON.stringify({
                    action: "peng",
                    actionCard: []
                }));
                self.getSelf().showAtionMenu();
                event.stopPropagation();
            });
            self.node.on("dan", function (event) {
                cc.sys.localStorage.removeItem('guo');
                if (self.dans && self.dans.length > 1) {
                    cc.sys.localStorage.removeItem('take');
                    self.showActionSelectPanel('dan', self.dans, self);
                } else {
                    let socket = self.getSelf().socket();
                    let danParam = [];
                    if (self.dans) {
                        danParam = self.dans[0];
                    }
                    socket.emit("selectaction", JSON.stringify({
                        action: 'dan',
                        actionCard: danParam
                    }));
                }
                //cc.find("");
                self.getSelf().showAtionMenu();
                event.stopPropagation();
            });
            self.node.on("gang", function (event) {
                cc.sys.localStorage.removeItem('guo');
                if (self.gangs && self.gangs.length > 1) {
                    cc.sys.localStorage.removeItem('take');
                    self.showActionSelectPanel('gang', self.gangs, self);
                } else {
                    let socket = self.getSelf().socket();
                    let gangParam = [];
                    if (self.gangs) {
                        gangParam = self.gangs[0];
                    }
                    socket.emit("selectaction", JSON.stringify({
                        action: 'gang',
                        actionCard: gangParam
                    }));
                }
                self.getSelf().showAtionMenu();
                event.stopPropagation();
            });

            /**
             * ActionEvent发射的事件 ， 点击 吃
             */
            self.node.on("chi", function (event) {
                cc.sys.localStorage.removeItem('guo');
                if (self.chis && self.chis.length > 1) {
                    cc.sys.localStorage.removeItem('take');
                    let array = [];
                    let array2 = [];
                    function sortNumber(a, b) { return a - b }
                    function sortNum(a, b) { return b.id - a.id }
                    for (let i = 0; i < self.chis.length; i++) {
                        let b = {};
                        self.chis[i].sort(sortNumber);
                        b.id = self.chis[i][0];
                        b.value = self.chis[i];
                        array.push(b);
                    }
                    array.sort(sortNum);
                    for (let i = 0; i < array.length; i++) {
                        array2.push(array[i].value);
                    }
                    self.showActionSelectPanel('chi', array2, self);
                } else {
                    let socket = self.getSelf().socket();
                    socket.emit("selectaction", JSON.stringify({
                        action: 'chi',
                        actionCard: self.chis[0]
                    }));
                }
                self.getSelf().showAtionMenu();
                event.stopPropagation();
            });
            /**
             * ActionEvent发射的事件 ， 点击 听
             */
            self.node.on("ting", function (event) {//点击听btn后先手牌点击响应关闭，后将tings中对应手牌列表一一打开点击响应和颜色
                cc.sys.localStorage.removeItem('guo');
                cc.sys.localStorage.setItem('ting', 'true');
                cc.sys.localStorage.setItem('alting', 'true');
                cc.weijifen.gameStartInit.initcardwidth(true);
                self.getSelf().tingAction();
                if (self.tings) {
                    let cards = cc.find('Canvas/cards/handCards/current/handCards');
                    for (let j = 0; j < self.tings.length; j++) {
                        let cv = self.tings[j].card;
                        for (let i = 0; i < cards.childrenCount; i++) {
                            let handCards = cards.children[i].getComponent("HandCard");
                            if ((cv < 0 && parseInt(cv / 4) == parseInt(handCards.value / 4)) || (cv >= 0 && handCards.mjtype == parseInt(cv / 36) && parseInt((handCards.value % 36) / 4) == parseInt((cv % 36) / 4))) {
                                handCards.cardvalue.color = new cc.Color(255, 255, 255);
                                cards.children[i].getComponent(cc.Button).interactable = true;
                            }
                        }
                    }
                }
                event.stopPropagation();
                self.getSelf().showAtionMenu();
            });
            /**
             * ActionEvent发射的事件 ， 点击 胡
             */
            self.node.on("hu", function (event) {
                cc.sys.localStorage.removeItem('guo');
                let socket = self.getSelf().socket();
                socket.emit("selectaction", JSON.stringify({
                    action: "hu",
                    actionCard: []
                }));
                self.getSelf().showAtionMenu();
                event.stopPropagation();
            });
            /**
             * ActionEvent发射的事件 ， 点击 过
             */
            self.node.on("guo", function (event) {
                //当自己收到的事件是guo时  为true  别人
                if (cc.sys.localStorage.getItem('guo') != 'true' || cc.sys.localStorage.getItem('alting') == 'true') {
                    cc.sys.localStorage.removeItem('altake');
                    let socket = self.getSelf().socket();
                    socket.emit("selectaction", JSON.stringify({
                        action: "guo",
                        actionCard: []
                    }));
                } else {
                    cc.sys.localStorage.setItem('take', 'true');
                }
                cc.sys.localStorage.removeItem('guo');
                self.getSelf().showAtionMenu();
                event.stopPropagation();
            });

            self.node.on('restar', function (event) {
                var gameStartInit = cc.weijifen.gameStartInit;
                if (event.getUserData()) {
                    cc.weijifen.menu = new cc.NodePool();
                    cc.weijifen.menu.put(cc.instantiate(self.menuPrefab));//菜单框
                    cc.weijifen.gongaoAlertNum = undefined;
                    cc.director.loadScene('gameMain');
                } else {
                    // 初始化
                    if (cc.sys.localStorage.getItem('clear') != 'true') {
                        let bths = cc.find('Canvas/bg/center/button/readyBtn');
                        if (cc.weijifen.match != 'true') {
                            bths.x = -10;
                        }
                        var laizi = cc.find('Canvas/cards/otherCards/cardTip/baoCard').children;
                        if (laizi) {
                            for (let i = 0; i < laizi.length; i++) {
                                laizi[i].destroy();
                            }
                        }
                        gameStartInit.reinitGame(self);
                    }
                    cc.sys.localStorage.removeItem('clear');
                    if (cc.weijifen.GameBase.gameModel == 'wz') {
                        self.showAtionMenu();
                    } else {
                        self.getSelf().showAtionMenu();
                    }
                    event.target.destroy();
                }
            });
            //   // 查看玩家是否离线（主监测电话中）
            // cc.weijifen.offline = function(status){
            //     //status    0:在线   1：离线  2：电话中
            //     let param = {
            //         userId: cc.weijifen.user.id,
            //         // userId: '37a538a553bf4e88820893274669992f',
            //         type: 4,
            //         status: status
            //     };
            //     socket.emit("sayOnSound" ,JSON.stringify(param));
            // }
            // cc.weijifen.offline(2);
            // 主监测游戏进入后台
            // 监听到该事件说明玩家已经离线，此时status为1
            cc.game.on(cc.game.EVENT_HIDE, function () {
                console.log('监听到hide事件，游戏进入后台运行！');
                let param = {
                    userId: cc.weijifen.user.id,
                    // userId: '37a538a553bf4e88820893274669992f',
                    type: 4,
                    status: 1
                };
                socket.emit("sayOnSound", JSON.stringify(param));
            });
            cc.game.on(cc.game.EVENT_SHOW, function () {
                console.log('监听到SHOW事件，游戏进入后台运行！');
                cc.sys.localStorage.setItem("isHide", 0);
                let param = {
                    userId: cc.weijifen.user.id,
                    // userId: '37a538a553bf4e88820893274669992f',
                    type: 4,
                    status: 0
                };
                socket.emit("sayOnSound", JSON.stringify(param));
                if (cc.weijifen.room) {
                    cc.weijifen.wjf.scene('majiang');
                }
            });

            self.node.on("touchend", function () {
                if (Number(cc.sys.localStorage.getItem("isHide")) == 1) {
                    cc.sys.localStorage.setItem("isHide", 0);
                    console.log('监听到SHOW事件，游戏进入后台运行1234！');
                    let param = {
                        userId: cc.weijifen.user.id,
                        // userId: '37a538a553bf4e88820893274669992f',
                        type: 4,
                        status: 0
                    };
                    socket.emit("sayOnSound", JSON.stringify(param));
                    if (cc.weijifen.room) {
                        cc.weijifen.wjf.scene('majiang');
                    }
                }
            });
            // 发送录音
            cc.weijifen.player_recording = function (param) {
                var param1 = {
                    type: 3,
                    userId: cc.weijifen.user.id,
                    content: param
                };
                socket.emit("sayOnSound", JSON.stringify(param1));
            }
            // 播放语音队列
            cc.weijifen.playVideo = function () {
                if (videoList.length == 0) {
                    cc.weijifen.isPLayVideo = false;
                } else {
                    var params = {
                        act: 4,
                        url: videoList[0]// 语音播放地址
                    };
                    videoList.shift();
                    // var result = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", 'recorderApi',JSON.stringify(params));
                    var jsonRes = JSON.stringify(params);
                    var result = jsb.reflection.callStaticMethod(...self.anMethodParam().recorderApi, jsonRes);
                }

            }
            cc.sys.localStorage.setItem('count', '0');
            cc.sys.localStorage.removeItem('current');
            cc.sys.localStorage.removeItem('right');
            cc.sys.localStorage.removeItem('left');
            cc.sys.localStorage.removeItem('top');
            cc.sys.localStorage.removeItem('isHide');//游戏切到后台时添加
            cc.sys.localStorage.removeItem('altake');
            cc.sys.localStorage.removeItem('alting');
            cc.sys.localStorage.removeItem('guo');
            cc.sys.localStorage.removeItem('unOver');
            cc.sys.localStorage.removeItem('clear');
            if (cc.sys.localStorage.getItem("dengdai") == null) {
                cc.sys.localStorage.removeItem("cango");
            }
            cc.sys.localStorage.removeItem('cb');
            cc.sys.localStorage.removeItem('timeIsClose');
            if (cc.sys.localStorage.getItem('zuomangjikai') == '1') {
                cc.sys.localStorage.setItem('zuomangjikai', '0');
                cc.sys.localStorage.setItem('zuomangjikai2', '0');
            } if (cc.sys.localStorage.getItem('zuomangjikai') == 'true' && cc.sys.localStorage.getItem('zuomangjikai2') == 'true') {
                cc.sys.localStorage.getItem('zuomangjikai') == '1'
            }

        }
    },

    tingAction: function (dd) {//点击听牌btn时，对手牌的操作
        let cards = cc.find('Canvas/cards/handCards/current/handCards');
        for (let i = 0; i < cards.childrenCount; i++) {
            let handCards = cards.children[i].getComponent("HandCard");
            if (dd) {
                handCards.cardvalue.color = new cc.Color(255, 255, 255);
            } else {
                handCards.cardvalue.color = new cc.Color(118, 118, 118);
            }
            cards.children[i].getComponent(cc.Button).interactable = false;
        }
    },
    showActionSelectPanel: function (event, params, context) {//显示可以action的相关牌型
        this._selectfather.active = true;
        let nodes = cc.find('Canvas/other/actionSelectBg/layout');
        for (var i = 1; i < nodes.childrenCount; i++) {//用之前先把原本的多余的清掉
            if (nodes.children[i]) nodes.children[i].destroy();
        }
        for (var i = 0; i < params.length; i++) {
            var b = cc.instantiate(nodes.children[0]);
            b.getComponent('HandCard').setAction({ 'name': event, 'params': params[i] });
            b.parent = nodes;
            for (var j = 0; j < params[i].length; j++) {
                var a = cc.instantiate(context.handcardPrefab);
                var src = a.getComponent('HandCard');
                src.init(params[i][j], 'current', true);
                src.offClick();
                a.parent = b;
            }
        }
    },
    showAtionMenu: function () {
        this._actionMenu.x = 2000;
        cc.sys.localStorage.removeItem('altake');
    },
    getSelf: function () {
        var self = cc.find("Canvas").getComponent("MJDataBind");
        return self;
    },
    addClickEvent: function () {
        //--------为录音btn添加点击事件
        let t_Start = this._btnNode.getChildByName('luYinBtn');
        let luyin_anim = cc.find('Canvas/luyin');
        let luyin_com = luyin_anim.children[1].getComponent(cc.Animation);
        let m = 1, timer;
        t_Start.on('touchstart', function (e) {
            m++;
            var json = {
                act: 1,
                token: cc.weijifen.authorization
            };
            t_Start.zIndex = 1100;
            luyin_anim.active = true;
            luyin_com.play('yuyin');
            if (m) {
                timer = setInterval(function () {
                    m++;
                    if (m > 16) {
                        var json = {
                            act: 2,
                            token: cc.weijifen.authorization
                        };
                        luyin_com.stop('yuyin');
                        var jsonRes = JSON.stringify(json);
                        jsb.reflection.callStaticMethod(...self.anMethodParam().recorderApi, jsonRes);
                        luyin_anim.active = false;
                        clearInterval(timer);
                    }
                }, 1000);
            }
            var jsonRes = JSON.stringify(json);
            jsb.reflection.callStaticMethod(...self.anMethodParam().recorderApi, jsonRes);
        });
        t_Start.on('touchend', function (e) {
            if (timer) clearInterval(timer);
            var json = {
                act: 2,
                token: cc.weijifen.authorization
            };
            luyin_com.stop('yuyin');
            var jsonRes = JSON.stringify(json);
            jsb.reflection.callStaticMethod(...self.anMethodParam().recorderApi, jsonRes);
            luyin_anim.active = false;
            m = 0;
        });
        //---------为录音btn添加点击事件
        //---------为chatbtn添加点击事件
    },
    initData: function () {
        if (cc.weijifen.match != 'true' || !cc.weijifen.match) {
            cc.find('Canvas/menuBtn/menu/exit').active = true;
        }
        cc.sys.localStorage.getItem("replayData") != null ? cc.find('Canvas/replay').active = true : cc.find('Canvas/replay').active = false;
        this._allHandCardNode = cc.find('Canvas/cards/handCards');
        this._btnNode = cc.find('Canvas/bg/center/button');
        this._cardTip = cc.find('Canvas/cards/otherCards/cardTip');
        this._tipsNode = cc.find('Canvas/AllTips');
        this._deskcardsNode = cc.find('Canvas/cards/deskCards');
        this._menuBtn = cc.find('Canvas/menuBtn');
        this._playersNode = this.node.getChildByName('players');
        this._actionMenu = this.node.getChildByName('action');
        this._selectfather = cc.find('Canvas/other/actionSelectBg');
        this._mjtimer = cc.find('Canvas/bg/center/timeLabel');
        this._chatMsg = cc.find('Canvas/chatMsgShow/msg');
        this._fangweiNode = cc.find('Canvas/bg/center/fangwei');
        this._ruleLabel = cc.find('Canvas/rulesBg/label');
        let arr = ['current', 'right', 'top', 'left'];
        cc.find('Canvas/cards/handCards/banHandcardClick').active = false;
        for (let i in arr) {
            let nodes = cc.find('Canvas/cards/handCards/' + arr[i] + '/handCards');
            if (nodes) arr[i] = nodes;
        }
        this._handCardNode = {//放置了所有玩家的手牌节点
            current: arr[0],
            right: arr[1],
            top: arr[2],
            left: arr[3]
        }
        cc.weijifen.shareRoomNum = "";          //通过分享得到的房间号
        this.playersarray = new Array();        //玩家列表\玩家头像父节点
        this.playercards = new Array();         //手牌对象
        this.leftcards = new Array();           //左侧玩家手牌
        this.rightcards = new Array();          //右侧玩家手牌
        this.topcards = new Array();           //对家手牌
        this.deskcards = new Array();           //当前玩家和 对家 已出牌
        this.chis = [];
        this.gangs = [];
        this.dans = [];
        this.right = '';// 用户信息
        this.left = '';
        this.top = '';
        cc.weijifen.wanfa = null;//玩法
        this.changeStatu("init");
    },
    initPool: function () {
        this.playerspool = new cc.NodePool();
        this.cardpool = new cc.NodePool();
        this.setting = new cc.NodePool();
        this.leave = new cc.NodePool();
        // 操作按钮
        this.setting.put(cc.instantiate(this.setpanelPrefab));
        for (var i = 0; i < 5; i++) {
            this.playerspool.put(cc.instantiate(this.playerheadPrefab));
        }
        if (cc.weijifen.cardNum) {
            for (var i = 0; i < cc.weijifen.cardNum + 1; i++) {
                this.cardpool.put(cc.instantiate(this.handcardPrefab));
            }
        } else {
            for (var i = 0; i < 14; i++) {
                this.cardpool.put(cc.instantiate(this.handcardPrefab));
            }
        }
    },
    /*
     在socket建立连接后初始化房间信息
     */
    playerIsReady: function (self) {
        cc.weijifen.playercount = 0;
        if (cc.weijifen.browserType == "wechat") {
            self.wxButton.node.active = true;
            let room = '';//房间号
            if (cc.weijifen.match != 'true') {
                room = cc.weijifen.room
            }
            cc.weijifen.WXorBlow.shareRoom(room);
        } else if (cc.weijifen.browserType != null) {
            self.ggButton.node.active = true;
        }
        //设置游戏玩家数量Canvas/players
        if (cc.weijifen.playerNum == 2) {
            self._playersNode.getChildByName('head_left').active = false;
            self._playersNode.getChildByName('head_right').active = false;
            self._deskcardsNode.getChildByName('top').width = 650;
            self._deskcardsNode.getChildByName('current').width = 650;
        } else if (cc.weijifen.playerNum == 3) {
            self._playersNode.getChildByName('head_left').active = false;
        }
        //房间号显示
        let roomNum = cc.find('Canvas/roomNum/roomSprite/roomId').getComponent(cc.Label);// roomNum节点
        let headImgCenter = cc.find('Canvas/qrcode');
        if (cc.weijifen.match == 'false') {
            cc.find('Canvas/players').active = true;
            roomNum.string = cc.weijifen.room;
        } else if (cc.weijifen.match == 'true') {
            self._menuBtn.children[0].children[1].active = false;//解散按钮隐藏
            roomNum.string = '比赛模式';
            self._btnNode.children[1].active = false;
            self._btnNode.children[0].active = false;
            self._playersNode.children[7].active = true;
            headImgCenter.active = true;
            headImgCenter.children[1].getComponent(cc.Label).string = cc.weijifen.user.username;
            if (cc.weijifen.user.headimgurl) {
                self.headImg(headImgCenter, cc.weijifen.user.headimgurl, true, true);
            }
        };
        /*设置圈数，圈数条显示*/
        let quanNum = cc.find('Canvas/roomNum/quanSprite/quanNum').getComponent(cc.Label);// quan节点
        self.maxRound = 0;
        if (cc.weijifen.maxRound) {
            self.maxRound = cc.weijifen.maxRound;
        }
        self.routes = {};
        quanNum.string = '0/' + self.maxRound;
        self.joinRoom(self);
    },
    /**
     * 状态切换，使用状态参数 切换，避免直接修改 对象状态，避免混乱
     */
    changeStatu: function (state) {
        cc.weijifen.state = state;
        let self = this;
        switch (state) {
            case "init":
                self._cardTip.active = false;
                let readybtn = self._btnNode.children[0];
                let invitBtn = self._btnNode.children[1];
                if (cc.weijifen.match == 'true') {//非比赛模式准备按钮显示
                    readybtn.active = false;
                    invitBtn.active = false;
                } else {
                    if (cc.weijifen.room && cc.weijifen.room.length == 6) {//判断是否开局，开局隐藏---------++++++++++++++
                        invitBtn.active = true;
                        readybtn.active = true;
                    } else {//已经开始游戏接受到了player
                        readybtn.active = false;
                        invitBtn.active = false;
                    }
                }
                /**
                 * 探照灯 熄灭
                 */
                self.changeLight("none", self);
                break;
            case "ready":
                // waitting.active = true;
                //ljh改 开局60s
                //self.timer(self , 60) ;
                break;
            case "begin":
                self.readyNoActive(self);
                //waitting.active = false ;
                /**
                 * 显示 当前还有多少张底牌
                 * @type {boolean}
                 */
                cc.find('Canvas/cards/otherCards/cardTip').active = true;
                /**
                 * 开始发牌动画，取消所有进行中的计时器
                 */
                self.canceltimer(self);
                break;
            case "play":
                /**
                 * 一个短暂的状态，等待下一步指令是 定缺 还是直接开始打牌 ， 持续时间的计时器是 2秒
                 */
                self.readyNoActive(self);
                self.timer(self, 0);
                break;
            case "selectcolor":
                /**
                 * 定缺 ，由服务端确定是否有此个节点，下个版本将会实现流程引擎控制 游戏 节点，一切都在服务端 进行配置工作
                 * @type {boolean}
                 */
                self.changeLight("current", self);
                selectbtn.active = true;
                self.timer(self, 0);
                break;
            case "selectresult":
                /**
                 * 选择了定缺结果，关闭选择按钮
                 * @type {boolean}
                 */
                selectbtn.active = false;
                self.canceltimer(self);
                break;
            case "lasthands":
                /**
                 * 选择了定缺结果，关闭选择按钮
                 * @type {boolean}
                 */
                /**
                 * 计时器方向
                 */
                if (cc.weijifen.match == 'true' || typeof cc.weijifen.match == 'function') {
                    self.timer(self, 10);
                } else {
                    self.timer(self, 15);
                }

                // self.timer(self , 8) ; 

                break;
            case "otherplayer":

                /**
                 * 计时器方向
                 */
                if (cc.weijifen.match) {
                    self.timer(self, 15);
                } else {
                    self.timer(self, 8);
                }

                if (cc.weijifen.match == 'true' || typeof cc.weijifen.match == 'function') {
                    self.timer(self, 10);
                }
                break;
            case "takecard":
                /**
                 * 选择了定缺结果，关闭选择按钮
                 * @type {boolean}
                 */
                banker.active = false;
                //self.canceltimer(self) ;
                break;
            case "nextplayer":
                if (self.action) {
                    if (self.action == "two") {
                        // let ani = self.actionnode_two.getComponent(cc.Animation);
                        // ani.play("majiang_action_end") ;
                    } else if (self.action == "three") {
                        let ani = self.actionnode_three.getComponent(cc.Animation);
                        ani.play("majiang_three_action_end");
                    } else if (self.action == "deal") {
                        self.actionnode_deal.active = false;
                    }
                }
                self.action = null;
                /**
                 * 选择了定缺结果，关闭选择按钮
                 * @type {boolean}
                 */
                if (cc.weijifen.match) {
                    self.timer(self, 15);
                } else {
                    self.timer(self, 8);
                }


                if (cc.weijifen.match == 'true' || typeof cc.weijifen.match == 'function') {
                    self.timer(self, 10);
                }
                break;
        }
    },
    canceltimer: function (object) {
        object.unscheduleAllCallbacks();
        object._mjtimer.getComponent(cc.Label).string = "00";
    },
    changeLight: function (direction, context) {
        var self = this;
        let time = setTimeout(function () {
            if (self._mjtimer) {
                for (var inx = 0; inx < self._mjtimer.children.length; inx++) {
                    if (direction == self._mjtimer.children[inx].name) {
                        self._mjtimer.children[inx].active = true;
                    } else {
                        self._mjtimer.children[inx].active = false;
                    }
                }
            }
            clearTimeout(time);
        }, 400);
    },
    joinRoom: function (context) {
        let socket = this.socket();
        // 地理位置
        // 调用android方法名：getLocation
        // 返回地址位置：lo经度；alt，海拔；t时间；
        var result;
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            result = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", 'getLocation', '');
        }
        if (cc.sys.os == cc.sys.OS_IOS) {
            result = jsb.reflection.callStaticMethod("AppController", "canGetPositions:", "123");
            if (result != null) {
                cc.sys.localStorage.setItem('iosPostion', result);
            } else {
                result = cc.sys.localStorage.getItem('iosPostion');
            }
        }
        if (result != null) {
            let res = JSON.parse(result);
            let params = {
                token: cc.weijifen.authorization,
                lng: res.lo,//j
                lat: res.la,//w
                alt: res.alt,
                t: res.t,
            }
            cc.weijifen.http.httpPost('/userInfo/position/save', params, this.getPositionX, this.getErr, this);
        }
        var param = {
            token: cc.weijifen.authorization,
            playway: cc.weijifen.playway,
            orgi: cc.weijifen.user.orgi
        };
        if (cc.weijifen.room) {
            param.room = cc.weijifen.room;
        } else {
            param.playway = '402888815e6f0177015e71529f3a0001',
                param.match = 1;
        }
        setTimeout(function () {
            socket.emit("joinroom", JSON.stringify(param));
        }, 300);
    },
    timer: function (object, times) {
        if (times > 9) {
            object._mjtimer.getComponent(cc.Label).string = times;
        } else {
            object._mjtimer.getComponent(cc.Label).string = "0" + times;
        }
        object.callback = function () {
            times = times - 1;
            if (times >= 0) {
                let text = times;
                if (times < 10) {
                    text = "0" + times;
                    if (cc.weijifen.match == 'true' && times < 1) {
                        let current_cards = cc.find('Canvas/cards/handCards/current/handCards');
                        if (current_cards.children[0]) {// 改条件：手牌未初始化，防止重新加载majiang场景时报错。
                            cc.weijifen.cardPostion = {
                                x: current_cards.x + current_cards.width - current_cards.children[0].width,
                                y: -(current_cards.y + current_cards.height)
                            };
                        }
                    }
                }
                object._mjtimer.getComponent(cc.Label).string = text;
            }
        }
        object.unscheduleAllCallbacks();
        /**
         * 启动计时器，应该从后台传入 配置数据，控制 等待玩家 的等待时长
         */
        object.schedule(object.callback, 1, times, 0);
    },
    readyNoActive: function (context) {
        let arr = ['left', 'right', 'top', 'current'];
        for (let i in arr) {
            let nodes = context._playersNode.getChildByName('ok_' + arr[i]);
            if (nodes) nodes.active = false;
        }
    },
    /*
  * 比赛模式，进入房间1分钟之后接收
  */
    changeRoom_event: function (data, context) {
        cc.weijifen.playerNum = data.playerNum;
        cc.weijifen.room = data.roomId;
        cc.weijifen.wjf.scene('majiang');
    },
    /*
   * 获取聊天列表，添加到父节点
   * @param chatStr  玩家名字和所发文字
   * @param chatShow 聊天列表窗口
   * @param mj       MJDataBind节点
   */
    addChatList: function (chatStr, chatShow, mj) {
        if (chatShow.children.length > 1) mj.clear(chatShow);
        let msgMode = cc.instantiate(mj._chatMsg);
        msgMode.active = true;
        let label = msgMode.getComponent(cc.Label);
        label.string = chatStr;
        label.fontSize = 20;
        msgMode.parent = chatShow;
        cc.find('Canvas/chat').active = false;
        chatShow.active = true;
        setTimeout(function () {
            chatShow.active = false;
            mj.clear(chatShow);
        }, 5000);
    },
    /*
   * 常用聊天语
   */
    commonMsg: function (event) {
        if (cc.weijifen.isPLayVideo) { return };
        let name = event.target.name;
        let msg = event.target.getComponent(cc.Label).string;
        let socket = this.socket();
        let content = JSON.stringify({
            msg: msg,
            musicName: name,
            username: cc.weijifen.user.username,
            userid: cc.weijifen.user.id
        })
        // type为文字
        let param = {
            type: 1,
            content: content
        }
        socket.emit("sayOnSound", JSON.stringify(param));
        cc.find('Canvas/chat').active = false;
    },
    /*
    * 清空聊天显示列表
    * @param chatShow 聊天列表窗口
    */
    clear: function (chatShow) {
        for (let i = 1; i < chatShow.children.length; i++) {
            chatShow.children[i].destroy();
        }
    },

    /*
    * 文字聊天事件处理
    * { type:
    *      1：文字
    *      2：表情
    *      3：语音
    *      4：是否离线（0:在线   1：离线  2：电话中）
    * }
    */
    talk_event: function (res1, obj) {
        let chatShow = cc.find('Canvas/chatMsgShow');
        let res = JSON.parse(res1);
        if (obj == null) { obj = cc.find('Canvas').getComponent('MJDataBind'); }
        // 文字
        if (res.type == 1) {
            let content = JSON.parse(res.content);
            let msg = content.username + '：' + content.msg;
            let gameStartInit = cc.weijifen.gameStartInit;
            let player = gameStartInit.player(content.userid, obj)
            obj.addChatList(msg, chatShow, obj);
            if (content.musicName) cc.weijifen.audio.playSFX('nv/' + content.musicName + '_' + cc.weijifen.genders[player.tablepos]);
            cc.weijifen.isPLayVideo = true;
            let timer = setTimeout(function () {
                cc.weijifen.isPLayVideo = false;
                clearTimeout(timer);
            }, 3800);
            return
        }
        // 表情
        if (res.type == 2) {
            //获取返回json数据
            let main = JSON.parse(res.content);
            let startX, startY;
            let endUserX = "", endUserY = "";//表情移动的位置
            var anim = cc.find('Canvas/emojiAni');
            for (let i = 0; i < obj.playersarray.length; i++) {
                let userId = obj.playersarray[i].getChildByName('id').getComponent(cc.Label).string;// 玩家id
                let name = obj.playersarray[i].parent.name;
                if (userId == main.mineId) {//当前用户id是发送表情的用户id
                    if (name == 'Canvas') {
                        startX = -580;
                        startY = -236;
                    } else {
                        startX = obj.playersarray[i].parent.x;
                        startY = obj.playersarray[i].parent.y;
                    }
                    anim.setPosition(startX, startY);
                    anim.active = true;
                }
                if (userId == main.targetId) {//当前用户id是发送表情的用户id
                    if (name == 'Canvas') {
                        endUserX = -580;
                        endUserY = -236;
                        anim.zIndex = 10000;
                    } else {
                        endUserX = obj.playersarray[i].parent.x;
                        endUserY = obj.playersarray[i].parent.y;
                    }
                }

            }
            let anims = anim.getComponent(cc.Animation);
            anims.play(main.animationName);
            let action = cc.moveTo(0.5, endUserX, endUserY);
            anim.runAction(action);
            setTimeout(function () {
                anim.active = false;
                anims.stop(main.animationName);
            }, 2000);
            return;
        }
        // 语音
        if (res.type == 3) {
            videoList.push(res.content);
            if (cc.weijifen.isPLayVideo == false) {
                var params = {
                    act: 4,
                    url: videoList[0]// 语音播放地址
                };
                cc.weijifen.isPLayVideo = true;
                videoList.shift();
                // var result = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", 'recorderApi',JSON.stringify(params));
                var jsonRes = JSON.stringify(params);
                var result = jsb.reflection.callStaticMethod(...obj.anMethodParam().recorderApi, jsonRes);
            }
            for (let i = 0; i < obj.playersarray.length; i++) {
                let userId = obj.playersarray[i].getChildByName('id').getComponent(cc.Label).string;// 玩家id
                if (userId == res.userId) {
                    var luyinicon = obj.playersarray[i].getChildByName('luyin_flag');
                    luyinicon.active = true;
                    let timer = setTimeout(function () {
                        luyinicon.active = false;
                        clearTimeout(timer);
                    }, 7000);
                    return;
                }
            }
        }
        // 是否离线
        if (res.type == 4) {
            // player  头像框父节点;
            // userId  状态发生改变的用户id
            // status  用户状态
            function playerId(player, userId, status) {
                let id;
                if (player.children[1]) {
                    id = player.children[1].getChildByName('id').getComponent(cc.Label).string;
                    if (status == 0 && id == userId) {
                        player.children[1].getChildByName('off_line_sign').active = false;
                        player.children[1].getChildByName('callingSign').active = false;
                        player.children[1].color = new cc.Color(255, 255, 255);
                    } else if (status == 1 && id == userId) {
                        player.children[1].getChildByName('off_line_sign').active = true;
                        player.children[1].getChildByName('callingSign').active = false;
                        player.children[1].color = new cc.Color(100, 100, 100);
                    } else if (status == 2 && id == userId) {
                        player.children[1].getChildByName('off_line_sign').active = false;
                        player.children[1].getChildByName('callingSign').active = true;
                        player.children[1].color = new cc.Color(100, 100, 100);
                    }
                }
            }
            function stateFn(userId, status) {
                if (num == 2) {
                    playerId(obj._playersNode.children[0], userId, status);
                    return
                }
                if (num == 3) {
                    playerId(obj._playersNode.children[1], userId, status);
                    playerId(obj._playersNode.children[0], userId, status);
                    return
                }
                if (num == 4) {
                    playerId(obj._playersNode.children[1], userId, status);
                    playerId(obj._playersNode.children[0], userId, status);
                    playerId(obj._playersNode.children[2], userId, status);
                    return
                }
            }
            let num = cc.weijifen.playerNum;
            let time = setTimeout(function () {
                stateFn(res.userId, res.status);
                clearTimeout(time);
            }, 500);
        }
    },
    headImageClick: function (event) {
        var headImgPositionX = event.target.x;
        var headImgPositiony = event.target.y;
        if (event.target.name == "head_top") {
            headImgPositionX = headImgPositionX - 182;
            headImgPositiony = headImgPositiony - 55;
        } else if (event.target.name == "head_left") {
            headImgPositionX = headImgPositionX + 190;
            headImgPositiony = headImgPositiony - 50;
        } else if (event.target.name == "head_right") {
            headImgPositionX = headImgPositionX - 171;
            headImgPositiony = headImgPositiony - 52;
        }
        if (event.target.children[1]) {
            cc.weijifen.emjioUserId = event.target.children[1].getChildByName('id').getComponent(cc.Label).string;
        }
        //弹出表情框    移动位置到头像位置
        var emoji = cc.find("Canvas/emoji");
        emoji.setPosition(headImgPositionX, headImgPositiony);
        if (emoji.active) {
            emoji.active = false;
        } else {
            emoji.active = true;
        }
    },
    /**
    * 获取玩家地理位置成功
    */
    getPositionX: function (result, obj) {
        let res = JSON.parse(result);
        obj.positionMsg = res.msg;
    },
    getErr: function (result, obj) {
        obj.alert('获取地理位置失败')
    },
    /**
     * 比赛模式：退出房间、退出房间再次进入后，倒计时
     */
    setCountDown: function () {
        let t = new Date();// 当前时间
        let d = new Date(Number(cc.sys.localStorage.getItem('appTime')));// 比赛开始的本地时间
        let a = d - t;
        cc.sys.localStorage.setItem('matchTime', a);
    },
    /*重新加载*/
    reloadMaJiang: function () {
        this.disconnect();
        cc.weijifen.wjf.scene('majiang');
    },
    // update (dt) {},
});
