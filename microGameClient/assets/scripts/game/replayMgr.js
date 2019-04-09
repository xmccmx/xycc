// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {


        backLobby: {  //返回大厅btn
            default: null,
            type: cc.Node
        },
        ctrl: {    //暂停、继续
            default: null,
            type: cc.Node
        },
        sudu: {        //快进
            default: null,
            type: cc.Node
        },
        roomLabel: { //房间号
            default: null,
            type: cc.Node
        },
        ningLabel: { //局数
            default: null,
            type: cc.Node
        },
        _lastAction: null,
        _actionMsg: null,
        _nowIndex: 0,
        _nextPlayTime: 1,
        _isPlaying: true, //游戏界面加载好，玩家位子都初始化好，发完牌之后打开，开始播放。。。或者把每步都写到takeaction

        _roomInit: null,
        _gameStartInit: null,
        _settingClick: null,
        _settingClick: null,
        _gameEvent: null,
        _gamePlay: null,
        _mjDataBind: null,

        _time: 1.7,
        _num: 0,

        isInit: false, //是否已经初始化所有玩家头像框

        _upid: null,
    },
    onLoad() {
        if (this.isReplay()) {
            this.init();
        }
    },
    onBtnPauseOrPlayClicked: function () {//暂停或继续
        this._isPlaying = !this._isPlaying;
        this._isPlaying ? this.ctrl.children[0].getComponent(cc.Label).string = '暂停' : this.ctrl.children[0].getComponent(cc.Label).string = '继续';

    },

    onBtnBackClicked: function () {
        var context = cc.find('Canvas').getComponent('MJDataBind');
        cc.weijifen.menu = new cc.NodePool();
        cc.weijifen.menu.put(cc.instantiate(context.menuPrefab));//菜单框
        /* if(cc.weijifen.GameBase.gameModel=='wz'){
             cc.director.loadScene('温州');
         }else{
             cc.director.loadScene('gameMain');                    
         }*/
        cc.weijifen.gongaoAlertNum = undefined;
        this.clear();
        cc.director.loadScene('gameMain');
        //清空所有需要清除的数据
    },
    onBtnGoClicked: function () {//快进
        if (this._time > 1) {
            this._time /= 2;
            this._num++;//1--x2  2--x4   需要修改控制器快进btn样式
            this.sudu.children[0].getComponent(cc.Label).string = '快进 x' + this._num * 2;
        }
        else {
            this._num = 0;
            this._time = 1.7;
            this.sudu.children[0].getComponent(cc.Label).string = '快进';
        }
    },
    clear: function () {//清空已有的数据
        this._lastAction = null;
        this._actionMsg = null;
        this._nowIndex = 0;
        cc.sys.localStorage.removeItem("replayData");
        cc.sys.localStorage.removeItem("replayRes");
    },
    init: function () {
        var d = cc.sys.localStorage.getItem("replayData");//初始化，将需要播放的数据放入管理类，并初始化下一步动作和当前播放位置
        var e = JSON.parse(d);
        var f = cc.sys.localStorage.getItem("numQuan");
        if (typeof e != 'object') {
            e = JSON.parse(e);
        }
        this._actionMsg = e[f];
        console.log(this._actionMsg);

        if (this._actionMsg == null) {
            this._actionMsg = {};
        }
        cc.weijifen.playerNum = this._actionMsg.boardEnd.length; //本局游戏人数
        this._mjDataBind = cc.find("Canvas").getComponent("MJDataBind");


        this._roomInit = cc.weijifen.roomInit;
        this._gameStartInit = cc.weijifen.gameStartInit;
        this._settingClick = cc.weijifen.settingClick;
        this._gameEvent = cc.weijifen.gameEvent;
        this._gamePlay = cc.weijifen.gamePlay;

        this._nowIndex = 0;
        this._lastAction = null;
    },

    isReplay: function () {//已有回放数据返回true，无-false
        return cc.sys.localStorage.getItem("replayData") != null;
    },

    getNextAction: function () {//数据没有播放完之前，返回下一步需要播放的数据
        var length = 1 + this._actionMsg.boardPlay.length;
        if (this._nowIndex >= length || length == undefined) {
            return null;
        }
        var action;
        if (this._nowIndex == 0) {
            for (var i = 0; i < this._actionMsg.boardInit.length; i++) {
                var data = JSON.parse(this._actionMsg.boardInit[i]);
                if (data.player.playuser == cc.weijifen.user.id) {
                    action = this._actionMsg.boardInit[i];//需要根据当前玩家cc.weijifen.user.id来判断拿哪一条数据作为自己视角播放
                    break;
                }
            }
        }
        else if (this._nowIndex == this._actionMsg.boardPlay.length) {
            action = this._actionMsg.boardEnd[0];//需要根据当前玩家cc.weijifen.user.id来判断拿哪一条数据作为自己视角播放
        } else {
            action = this._actionMsg.boardPlay[this._nowIndex - 1];
        }
        this._nowIndex++;
        return action;
    },
    takeAction: function () {//判断下步数据类型，执行相应函数，返回一个时间段
        if (this.isInit) {
            var action = JSON.parse(this.getNextAction());
            if (action == null) {
                return - 1;
            }
            if (this._actionMsg.replacePowerCard) {//宝牌更换时重新刷新宝牌
                let cards = this._actionMsg.powerCard;
                var laiziZM = cc.find("Canvas/cards/otherCards/cardTip/baoCard").children[0];
                var LZH = laiziZM.getComponent('DeskCard');
                LZH.init(cards, 'B', true);
            }
            if (action.changeRoom) {
                this._mjDataBind.changeRoom_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.talkOnSay) {
                this._mjDataBind.talk_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.joinroom) {
                this._roomInit.joinroom_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.lasthands) {//先手出牌
                this._gamePlay.lasthands_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.command == 'allcards') {//结算信息
                this._gameEvent.allcards_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.type == 'isOver') {
                this._settingClick.isOver_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.type == 'gameOver') {
                this._settingClick.gameOver_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.type == 'over') {
                this._settingClick.over_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.type == 'unOver') {
                this._settingClick.unOver_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.type == 'banker') {//庄家
                this._gameStartInit.banker_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.type == 'players') {//房间中玩家的信息
                this._gameStartInit.players_event(action, this._mjDataBind);
                return this._time;
            }
            if (action.command == 'play') {//所有玩家手牌
                action.player.powerCard[0] = this._actionMsg.powerCard;
                this._gameStartInit.play_event(JSON.stringify(action), this._mjDataBind);//暂时使用重写后的
                for (var i = 0; i < action.players.length; i++) {
                    var p = action.players[i];
                    if (p) {
                        this.sortHandCard(p.playuser);
                    }
                }
                var res = JSON.parse(cc.sys.localStorage.getItem("replayRes"));
                this.roomLabel.getComponent(cc.Label).string = res.playUserList[0].gameResult.roomNumber;
                this.ningLabel.getComponent(cc.Label).string = '第' + (Number(cc.sys.localStorage.getItem("numQuan")) + 1) + '局';
                return this._time + 0.5;
            }
            if (action.takeCards || action.command == 'takeCards') {//出牌
                if (action.user != cc.weijifen.user.id) {
                    this.delCardOnCardArr(action.user, action);
                    this.sortHandCard(action.user, true);
                }
                this._upid = action.user;
                if (cc.find('Canvas/showTakeCardPanel').children) {
                    cc.find('Canvas/showTakeCardPanel').removeAllChildren();
                    var arr = ['current', 'right', 'top', 'left'];
                    for (let i in arr) {
                        let desk = cc.find('Canvas/cards/deskCards/' + arr[i]);
                        if (desk.children.length > 0) desk.children[desk.childrenCount - 1].active = true;
                    }
                }
                this._gamePlay.takecard_event(action.takeCards, this._mjDataBind);
                if (action.user == cc.weijifen.user.id && cc.sys.os == cc.sys.OS_ANDROID) {//安卓机自己出牌和动作没有声音
                    let cardcolors = parseInt(action.takeCards.card / 4);
                    let cardtype = parseInt(cardcolors / 9);
                    var fangwei = 'B';
                    var gameModelMp3 = "";//播放声音
                    var direction = 'top';
                    var value = action.takeCards.card;
                    if (cc.weijifen.GameBase.gameModel == "wz") {
                        gameModelMp3 = "wz";
                    }
                    if (cardcolors < 0) {
                        cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + 'wind_' + (cardcolors + 8) + cc.weijifen.genders[direction] + '.mp3');
                        //东南西北风 ， 中发白
                    } else if (cardtype == 0) { //万
                        cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + 'wan_' + (parseInt((value % 36) / 4) + 1) + cc.weijifen.genders[direction] + '.mp3');
                    } else if (cardtype == 1) { //筒
                        cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + 'tong_' + (parseInt((value % 36) / 4) + 1) + cc.weijifen.genders[direction] + '.mp3');
                    } else if (cardtype == 2) {  //条
                        cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + 'suo_' + (parseInt((value % 36) / 4) + 1) + cc.weijifen.genders[direction] + '.mp3');
                    }

                }
                var t = this._time - 0.8;
                t < 0.8 ? t = 0.8 : t;
                return t;
            }
            if (action.dealCard) { //摸牌
                action.user != null ? action.userId = action.user : null;
                this._gamePlay.dealcard_event(action.dealCard, this._mjDataBind);
                if (action.userId != cc.weijifen.user.id) {
                    var context = this._mjDataBind;
                    let playerss = this._gameStartInit.player(action.userId, context);
                    var arr = cc.find('Canvas/cards/handCards/' + playerss.tablepos + '/handCards');
                    var lastCard = arr.children[arr.childrenCount - 1];
                    var deskCard = lastCard.getComponent('DeskCard');
                    lastCard.zIndex = 800;
                    deskCard.init(action.dealCard.card, playerss.tablepos, undefined, playerss.tablepos, 'false');//渲染别的玩家摸到的牌
                    return this._time - 0.2;
                }
                return this._time - 0.4;
            }
            if (action.action) {
                action.user != null ? action.userId = action.user : null;
                if (action.action == "guo") {
                    return this._time;
                }
                if (action.action == "ting") {
                    if (cc.sys.os == cc.sys.OS_ANDROID) {
                        var gameModelMp3 = "";//播放声音
                        if (cc.weijifen.GameBase.gameModel == "wz") {
                            gameModelMp3 = "wz";
                        }
                        cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + 'ting' + '_' + cc.weijifen.genders['current'] + '.mp3');
                    }
                    return this._time + 0.5;
                }
                if (action.userId != cc.weijifen.user.id) {
                    if (action.action == 'dan' || action.action == 'peng' || action.action == 'chi' || action.action == 'gang') {
                        this.delCardOnCardArr(action.userId, action);
                        if (action.action == 'peng') {//别的玩家碰的时候，传来的card中只有一张牌，所以按照int值处理
                            action.actionCard.push(action.actionCard[0]);
                            action.actionCard.push(action.actionCard[0]);
                        }
                    }
                } else {
                    if (action.action == 'peng') {//自己碰的时候，传来的card中只有一张牌，所以按照int值处理
                        action.actionCard.push(action.actionCard[0]);
                        action.actionCard.push(action.actionCard[0]);
                    }
                }
                var k;
                action.action == 'gang' ? k = action : k = action.actionCard.length;
                var data = {
                    action: action.action,
                    cards: action.actionCard,//action的几张牌
                    // card:1,  //被吃牌的值。或者蛋牌的值
                    command: "selectaction",
                    userid: action.userId,
                    target: action.target,//被吃牌的人的id
                    time: 0,
                    banker: null,
                    cardvalue: k,
                }
                this._gameEvent.selectaction_event(data, this._mjDataBind);
                if (action.userId == cc.weijifen.user.id && cc.sys.os == cc.sys.OS_ANDROID) {
                    cc.weijifen.audio.playSFX('nv/' + action.action + '_' + cc.weijifen.genders["top"] + '.mp3');
                }
                var context = this._mjDataBind;
                if (action.userId == cc.weijifen.user.id && action.action == 'peng') {//自己碰的时候删除自己手牌中的action牌
                    for (let i = 0; i < data.cards.length - 1; i++) {
                        for (let inx = 0; inx < context.playercards.length; inx++) {
                            let temp = context.playercards[inx].getComponent("HandCard");
                            var Va, Vb;
                            if (data.cards[i] >= 0) {
                                Va = parseInt(data.cards[i] / 4);
                            } else {
                                Va = 26 - parseInt(data.cards[i] / 4);;
                            }
                            if (temp.value >= 0) {
                                Vb = parseInt(temp.value / 4);
                            } else {
                                Vb = 26 - parseInt(temp.value / 4);
                            }
                            if (Va == Vb) {
                                context.cardpool.put(context.playercards[inx]);
                                context.playercards.splice(inx, 1);
                            }
                        }
                    }
                }
                return this._time + 0.5;
            }
        } else {
            this.node.zIndex = 31111;
            this.roomLabel.getComponent(cc.Label).string = cc.weijifen.room || '';
            this.ningLabel.getComponent(cc.Label).string = '第' + (Number(cc.sys.localStorage.getItem("numQuan")) + 1) + '局';
            var res = JSON.parse(cc.sys.localStorage.getItem("replayRes"));
            //cc.weijifen.user.id = res.playUserList[0].gameResult.userId;//因为直接用token拿到的战绩，不是自己的所以需要改变默认id以适应gameevent中删除手牌js
            var roomInit = this._roomInit;
            var context = this._mjDataBind;
            cc.find('Canvas/cards/handCards/top/handCards').y -= 3;
            var r_handcard = cc.find('Canvas/cards/handCards/right/handCards');
            var l_handcard = cc.find('Canvas/cards/handCards/left/handCards');
            r_handcard.getComponent(cc.Layout).spacingY = -8;
            r_handcard.parent.x -= 40;
            r_handcard.parent.children[0].x += 23;
            l_handcard.getComponent(cc.Layout).spacingY = -8;
            l_handcard.parent.children[0].x = -46;
            var me = 1;
            for (var i = 0; i < res.playUserList.length; i++) {//加载所有玩家头像单位
                var player = context.playerspool.get();
                var playerscript = player.getComponent("MJPlayer");
                var tablepos = "", num;
                if (res.playUserList.length == 2) {
                    if (res.playUserList[i].gameResult.userId == cc.weijifen.user.id) {
                        tablepos = 'current';
                        num = '0';
                    } else {
                        tablepos = 'top';
                        num = '2';
                    }
                } else {
                    if (res.playUserList[i].gameResult.userId == cc.weijifen.user.id) {
                        tablepos = 'current';
                        num = '0';
                    } else if (me == 1) {
                        me++;
                        tablepos = 'right';
                        num = '1';
                    } else if (me == 2) {
                        me++;
                        tablepos = 'top';
                        num = '2';
                    } else if (me == 3) {
                        tablepos = 'left';
                        num = '3';
                    }
                }
                roomInit.playerPosition(player, tablepos, { id: res.playUserList[i].gameResult.userId }, num);
                var data = {
                    online: true,
                    id: res.playUserList[i].gameResult.userId,
                    headimgurl: res.userImgUrl[res.playUserList[i].gameResult.userId],
                    username: res.playUserList[i].gameResult.nickname,
                    goldcoins: '',
                    playerlevel: -1
                }
                playerscript.init(data, tablepos);
                context.playersarray.push(player);
            }
            cc.find('Canvas/bg/center/button').children[0].active = false; //隐藏准备brn等
            cc.find('Canvas/bg/center/button').children[1].active = false; //隐藏准备brn等
            this.isInit = true; //因为初始化和游戏数据不在一个数据单位中，加个标识，已经初始化
            this._isPlaying = true;
            return 0.6;
        }
    },
    //给别人的手牌排序
    sortHandCard: function (userid, one) {
        let playerss = this._gameStartInit.player(userid, this._mjDataBind);
        var arr = cc.find('Canvas/cards/handCards/' + playerss.tablepos + '/handCards');
        if (one) {
            var lastcard = arr.children[arr.childrenCount - 1];
            var src = lastcard.getComponent('DeskCard');
            if (src.value < 0) {
                lastcard.zIndex = src.value + 200;
            } else {
                lastcard.zIndex = src.value;
            }
            return;
        }
        for (var i = 0; i < arr.children.length; i++) {
            var deskcard = arr.children[i].getComponent('DeskCard');
            if (deskcard.value < 0) {
                arr.children[i].zIndex = deskcard.value + 200;
            } else {
                arr.children[i].zIndex = deskcard.value
            }
        }
    },
    //碰、蛋、杠、吃、出牌从非本玩家手牌array中destory对应的牌
    delCardOnCardArr: function (userId, action) {
        var gameStartInitNode = cc.find('Canvas').getComponent('GameStartInit');
        let playerss = this._gameStartInit.player(userId, this._mjDataBind);
        var fangweis = "top";
        var temp = gameStartInitNode.deskcard_one;
        var index = "B";
        if (playerss.tablepos == 'left') {
            fangweis = "left";
            index = "L";
            temp = gameStartInitNode.deskcard_left;
        } else if (playerss.tablepos == 'right') {
            fangweis = "right";
            temp = gameStartInitNode.deskcard_right;
            index = "R";
        }
        var arr = cc.find('Canvas/cards/handCards/' + fangweis + '/handCards').children;
        if (action.takeCards) { //别人出牌时从别人手牌中删除相应的牌
            for (var inx = 0; inx < arr.length; inx++) {
                var deskcard = arr[inx].getComponent("DeskCard");
                if (action.takeCards.card == deskcard.value) {
                    arr[inx].destroy();
                    break;
                }
            }
            return;
        }
        if (action.action == 'peng') {
            var card;
            if (action.actionCard[0] >= 0) {
                card = parseInt(action.actionCard[0] / 4);
            } else {
                card = 26 - parseInt(action.actionCard[0] / 4);
            }
            var count = 0;
            for (var i = 0; i < arr.length; i++) {//删除别的玩家手牌中碰牌
                var deskcard = arr[i].getComponent("DeskCard");
                var values;
                if (deskcard.value >= 0) {
                    values = parseInt(deskcard.value / 4);
                } else {
                    values = 26 - parseInt(deskcard.value / 4);
                }
                if (values == card) {
                    count++;
                    arr[i].destroy();
                    if (count == 2) {
                        break;
                    }
                }
            }
            return;
        }
        for (var i = 0; i < action.actionCard.length; i++) {//别人碰、蛋、杠、吃等时从别人手牌中删除相应的牌
            for (var inx = 0; inx < arr.length; inx++) {
                deskcard = arr[inx].getComponent("DeskCard");
                if (action.actionCard[i] == deskcard.value) {
                    arr[inx].destroy();
                    break;
                }
            }
        }
    },
    update(dt) {
        if (this._isPlaying && this.isReplay() == true && this._nextPlayTime > 0) {
            this._nextPlayTime -= dt;
            if (this._nextPlayTime < 0) {
                this._nextPlayTime = this.takeAction();
            }
        }
    },
});
