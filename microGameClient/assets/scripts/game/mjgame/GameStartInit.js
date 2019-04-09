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
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        deskcard_one: cc.Prefab,
        deskcard_left: cc.Prefab,
        deskcard_right: cc.Prefab,
        handcard_top: cc.Prefab,
        handcard_left: cc.Prefab,
        handcard_right: cc.Prefab,

        _cardsCount: cc.Label,//桌面剩余牌数的label
        _baoCardParent: cc.Node,//宝牌节点的父节点
        _handCardNode: cc.Node,//所有玩家手牌的父节点
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this._cardsCount = cc.find('Canvas/cards/otherCards/cardTip/numLabel').getComponent(cc.Label);
        this._baoCardParent = cc.find('Canvas/cards/otherCards/cardTip/baoCard');
        this._handCardNode = cc.find('Canvas/cards/handCards');
        // 比赛倒计时显示
        let dataStr = cc.sys.localStorage.getItem('matchData');
        var appTime = cc.sys.localStorage.getItem('appTime');
        const getSokectUrl = () => {
            let Match = require('match');
            let matchJs = new Match();
            let activityId = cc.sys.localStorage.getItem('activityId');
            let params = {
                token: cc.weijifen.authorization,
                activityId: activityId
            }
            cc.weijifen.http.httpPost('/match/timeWait', params, matchJs.joinSuccess, matchJs.joinErr, matchJs);
            cc.sys.localStorage.setItem('gotWsUrl', 'true');
        }
        if (cc.sys.localStorage.getItem('matchType') == 5 && !cc.sys.localStorage.getItem('isPlay')) {
            if (!cc.sys.localStorage.getItem('zuomangjikai') || cc.sys.localStorage.getItem('zuomangjikai') == '1' && cc.sys.localStorage.getItem('zuomangjikai2') == 'true' || cc.sys.localStorage.getItem('zuomangjikai') == '0' && cc.sys.localStorage.getItem('zuomangjikai2') == '0') {
                getSokectUrl();
                if (!cc.sys.localStorage.getItem('zuomangjikai')) {
                    cc.sys.localStorage.setItem('zuomangjikai', 'true');
                    cc.sys.localStorage.setItem('zuomangjikai2', 'true');
                }
                cc.weijifen.endMatchFlag = 0;
            }
            return
        }
        if (dataStr && this.countDown && cc.sys.localStorage.getItem('matchTime')) {
            var date = new Date().getTime();
            var time = Number(appTime - date) + 1000;
            if (appTime) {
                if (parseInt(time) > 1000) this.countDown(appTime - date);
                if (time > 0) {
                    let wsUrlTime = setTimeout(function () {
                        if (cc.sys.localStorage.getItem('timeIsClose') == 'true') {
                            getSokectUrl();
                        }
                        clearTimeout(wsUrlTime);
                    }, time);
                } else if (time < 0) {
                    // 黑屏之后进入游戏
                    getSokectUrl();
                    cc.sys.localStorage.removeItem('appTime');
                }
                cc.weijifen.endMatchFlag = 0;
                return
            }
            this.countDown(time);//statrtSec距离比赛开始的毫秒数
            let wsUrlTime = setTimeout(function () {
                if (cc.sys.localStorage.getItem('timeIsClose') == 'true') {
                    getSokectUrl();
                }
                clearTimeout(wsUrlTime);
            }, time);
        }
        cc.weijifen.endMatchFlag = 0;
    },
    /*
        * 获取所有玩家信息
        * @param data 回调值
        * @param context 上下文对象
        */
    players_event: function (data, context) {
        if (cc.weijifen.match == 'true' || typeof cc.weijifen.match == 'function') {
            cc.weijifen.playerNum = data.players.length;
        }
        cc.weijifen.banker = data.players[0].id;
        var self = cc.weijifen.gameStartInit;
        if (cc.weijifen.state == 'init' || cc.weijifen.state == 'ready') {
            self.collect(context);    //先回收资源，然后再初始化
            self.killPlayers(data);
        }
        //OK手势隐藏
        context.readyNoActive(context);
        let qqq = ['东', '南', '西', '北'];
        let array = ['东', '南', '西', '北'], arr = ['current', 'right', 'top', 'left'];
        let p_arr = [];
        for (var p in data.players) {
            p_arr.push(data.players[p]);
        }
        if (data.players.length == 2) {//玩家人数为2，
            if (data.players[0].id != cc.weijifen.user.id) {//且自己非庄--方位渲染为南东北西---id加载顺序为进房先后，所以先加载top后current
                array = ['东', '南', '北', '西'];
                arr = ['top', 'current', 'right', 'left'];
            } else {
                array = ['东', '南', '西', '北'];
                arr = ['current', 'top', 'right', 'left'];
            }
        } else {
            var a;
            for (var i = 0; i < data.players.length; i++) {
                if (data.players[i].id == cc.weijifen.user.id) {
                    if (i == 0) break;
                    if (data.players.length == 3) a = array.pop();//只有三个玩家时南西北东、西北东南  都需要改为南西东北、西东南北
                    array.splice(0, i);
                    p_arr.splice(0, i);
                    for (var j = 0; j < i; j++) {
                        array.push(qqq[j]);
                        p_arr.push(data.players[j]);
                    }
                    if (data.players.length == 3) array.push(a);
                }
            }
        }
        for (var i in array) {
            self.fw(arr[i], array[i], context);
            if (p_arr[i]) {
                self.publicData(p_arr[i], arr[i], context._playersNode.getChildByName('head_' + arr[i]), context);
                if (p_arr[i].status && p_arr[i].status == 'READY' && !cc.weijifen.banker) {
                    self.readyTrue(arr[i], context);
                }
            }
        }
    },
    /*
      * 玩家进入房间后初始玩家方位、名称、头像
      * @param inx       玩家进入房间的顺序
      * @param data
      * @param fangwei   玩家显示位置
      * @param OPparent 
      * @param int 
      * @param count     玩家位置标记(：以当前玩家位置为参照（顺时针）---0,1,2,3)
      */
    publicData: function (data, fangwei, OPparent, context) {
        for (var i in context.playersarray) {
            var src = context.playersarray[i].getComponent("MJPlayer");
            if (src.id.string == data.id) {
                return;
            }
        }
        if (cc.sys.localStorage.getItem(fangwei) != data.id) {
            let player0 = context.playerspool.get();
            if (player0) {
                let playerscript0 = player0.getComponent("MJPlayer");
                player0.setPosition(0, 0);
                context.playersarray.push(player0);
                player0.parent = OPparent;
                playerscript0.init(data, fangwei);
                cc.sys.localStorage.setItem(fangwei, data.id);
            }
        }
    },
    fw: function (fangwei, name, obj) {//
        name = 'atlas/mj/' + name + 2;
        cc.loader.loadRes(name, cc.spriteFrame, function (err, res) {
            if (err) {
                console.log(err);
            }
            if (res) {
                obj._fangweiNode.getChildByName(fangwei).getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(res);
            }
        });
        let arr = {
            'left': 90,
            'right': -90,
            'top': 180,
            'current': 0
        }
        obj._fangweiNode.getChildByName(fangwei).rotation = arr[fangwei];
    },
    readyTrue: function (fangwei, context) {//准备时打开ok手势
        var name = 'ok_' + fangwei;
        context._playersNode.getChildByName(name).active = true;
    },
    /**
            * 回收系统资源，用于清理资源
            * @param context
            */
    collect: function (context) {
        for (var i = 0; i < context.playersarray.length;) {
            let player = context.playersarray[i];
            var playerscript = player.getComponent("MJPlayer");
            if (playerscript.id.string != cc.weijifen.user.id) {       //当前 玩家不回收，最终 Destroy 的时候会被回收
                playerscript.id.string = '';
                context.playerspool.put(player);
                context.playersarray.splice(i, 1);
            } else {
                i++;
            }
        }
    },
    killPlayers: function (data) {//移除其他玩家缓存id
        cc.sys.localStorage.removeItem('top');
        cc.sys.localStorage.removeItem('left');
        cc.sys.localStorage.removeItem('right');
        cc.weijifen.playercount = data.players.length;//上次渲染的玩家头像数量
    },
    /**
        * 接受新的庄家数据
        * @param data
        * @param context
        */
    banker_event: function (data, context) {//设置庄家id
        cc.weijifen.banker = data.userid;
        for (var inx = 0; inx < context.playersarray.length; inx++) {
            let temp = context.playersarray[inx].getComponent("MJPlayer");
            if (temp.id.string == data.userid) {
                temp.zhuangNode.active = true;
                break;
            }
        }
    },
    /**
      * 接收发牌信息，需要根据玩家位置确定是哪家的牌
      * @param data  事件返回信息。包括牌、用户、
      * @param context
      */
    play_event: function (data, context) {
        let self = cc.find('Canvas').getComponent('GameStartInit');
        if (cc.sys.localStorage.getItem('isPlay') == 'true') {
            cc.sys.localStorage.setItem('zuomangjikai', '1');//-----------
        }
        if (cc.weijifen.match != 'true') {
            cc.find('Canvas/menuBtn/menu/exit').active = false;
        }
        cc.sys.localStorage.setItem('isPlay', 'true');
        cc.weijifen.zuomangjikai = null;//-----------------
        context.readyNoActive(context);//发牌了  关闭所有OK手势
        context._btnNode.getChildByName('readyBtn').active = false;
        context._btnNode.getChildByName('friendBtn').active = false;
        if (cc.weijifen.match == 'true' || typeof cc.weijifen.match == 'function') {
            cc.find('Canvas/headImg').active = false;//-----------
            cc.find('Canvas/players').active = true;
        }
        if (cc.weijifen.playerNum == 2) {//发牌了，将多余的默认头像关闭
            context._playersNode.getChildByName('head_right').active = false;
            context._playersNode.getChildByName('head_left').active = false;
        } else if (cc.weijifen.playerNum == 3) {
            context._playersNode.getChildByName('head_left').active = false;
        }
        context.loadding();//加载动画
        let ipTimer = setTimeout(function () {//5秒后消失的提示框
            let userIp = cc.find("Canvas/userIp");
            if (userIp) userIp.active = false;
            clearTimeout(ipTimer);
        }, 5000);
        if (cc.find('Canvas/summary')) {//发牌了，把没有关掉的结算信息关掉
            cc.find('Canvas/summary').destroy();
        }
        //初始化数据
        cc.weijifen.baopai = null;

        let cardTime = setTimeout(function () {//剩余牌的一个渐减少效果
            self.showCardsCount(self, 136, data.deskcards);
            clearTimeout(cardTime);
        }, 0);
        var data = JSON.parse(data);//获取json数据
        if (cc.weijifen.wanfa) {
            context._ruleLabel.getComponent(cc.Label).string = cc.weijifen.wanfa;
        }
        //移动头像到对应位置
        var action = cc.moveTo(0.2, 570, 80);
        context._playersNode.getChildByName('head_right').runAction(action);
        var action = cc.moveTo(0.2, -590, 80);
        context._playersNode.getChildByName('head_left').runAction(action);
        var action = cc.moveTo(0.2, 389, 270);
        context._playersNode.getChildByName('head_top').runAction(action);
        var action = cc.moveTo(0.2, -580, -125);
        context._playersNode.getChildByName('head_current').runAction(action);
        // self.reinitGame(context);
        //设置圈数、玩法
        let quanNum = cc.find('Canvas/roomNum/quanSprite/quanNum').getComponent(cc.Label);
        quanNum.string = (data.round + 1) + '/' + cc.weijifen.maxRound;//圈数
        context._ruleLabel.active = true;//显示桌面玩法label
        context._ruleLabel.getComponent(cc.Label).string = data.op;;//设置玩法 
        cc.weijifen.wanfa = data.op;
        context.readyNoActive(context);//关闭所有ok手势
        cc.sys.localStorage.removeItem("matchTime");
        cc.sys.localStorage.removeItem("appTime");
        //游戏开始 干掉打牌和听得缓存
        cc.sys.localStorage.removeItem('take');
        cc.sys.localStorage.removeItem('ting');
        context.changeStatu("begin", context);//关掉OK手势 打开余牌tip 清掉所有计时器

        /*
        * temp_player 为当前用户的信息
        * cards       当前用户手牌的信息
        */
        var temp_player = data.player;
        var cards = data.player.cards;

        //设置宝牌
        if (cc.weijifen.GameBase.gameModel == 'wz' || cc.weijifen.GameBase.gameModel == 'ls') {
            if (temp_player.powerCard) {
                var powerCard = temp_player.powerCard;
                cc.weijifen.powerCard = powerCard;
                self.csNode.active = true;
                //切换财神图片
                if (powerCard && powerCard.length > 0) {
                    for (let i = 0; i < self._baoCardParent.childrenCount; i++) {
                        self._baoCardParent.children[i].destroy();
                    }
                    cc.weijifen.baopai = powerCard;
                    for (let i = 0; i < powerCard.length; i++) {
                        cc.weijifen.caishenCard += powerCard[i] + ",";
                        var laiziZM = cc.instantiate(self.deskcard_one);
                        laiziZM.parent = self._baoCardParent;
                        var LZH = laiziZM.getComponent('DeskCard');
                        LZH.init(powerCard[i], 'B', true);
                    }
                }
            }
        } else {
            if (cc.weijifen.GameBase.gameModel != 'nj') {
                // 宝牌显示
                self._baoCardParent.active = true;
                if (!data.player.powerCard) {
                    // 可以看到牌值
                    let cards = data.player.powerCard;
                    for (let i = 0; i < cards.length; i++) {
                        var laiziZM = cc.instantiate(self.deskcard_one);
                        laiziZM.parent = self._baoCardParent;
                        var LZH = laiziZM.getComponent('DeskCard');
                        LZH.init(cards[i], 'B', true);
                    }
                } else {
                    // 看不到牌值
                    var laiziFM = cc.instantiate(self.deskcard_one);
                    var LZH = laiziFM.getComponent('DeskCard');
                    if (cc.weijifen.GameBase.gameModel == 'ch') LZH.back = true;
                    LZH.init(-3, 'Z', true);
                    laiziFM.parent = self._baoCardParent;
                }
            }
        }


        var pTimes;//便利牌数据
        var gender_fw;
        var arry = context.playersarray;
        for (let j = 0; j < arry.length; j++) {
            let mid;
            var mjplayer = arry[j].getComponent('MJPlayer');
            j == 0 ? mid = data.player : mid = data.players[j - 1];
            if (mid != undefined && mid.gender != undefined && mid.gender != null) {
                mid.gender == 2 ? gender_fw = 'w' : gender_fw = 'm';
                cc.weijifen.genders[mjplayer.tablepos] = gender_fw;
            } else {
                cc.weijifen.genders[mjplayer.tablepos] = 'm';
            }
        }
        if (cc.weijifen.GameBase.gameModel == 'wz') {
            pTimes = 5;
        } else {
            pTimes = 4;
        }
        //渲染当前玩家手牌
        self.initMjCards(context, cards);
        //初始化其他玩家手牌
        for (var i = 0; i < data.players.length; i++) {
            if (data.players[i].playuser != cc.weijifen.user.id) {
                var mjplayer = self.player(data.players[i].playuser, context);
                self.initPlayerHandCards(mjplayer.tablepos, context, data.players[i].deskcards, data.players[i].history);
            }
        }
        cc.weijifen.audio.playSFX('shuffle');
        var mp3Music = cc.weijifen.audio.getSFXVolume();
        //排序 ---设置牌的zIndex（官方排序方法要用到）
        if (context.playercards) {
            for (var i = 0; i < context.playercards.length; i++) {
                let card = context.playercards[i];
                if (card.children[1].active == false) {
                    let temp_script = card.getComponent("HandCard");
                    if (temp_script.value >= 0) {
                        card.zIndex = temp_script.value;
                    } else {
                        card.zIndex = 200 + temp_script.value;
                    }
                }
            }
        }
        if (cc.sys.localStorage.getItem('cb') != 'true') {//-----------------------
            context.changeStatu("play", context);
        }

        if (data.player.banker == true) {//当前玩家是庄家
            let datas = {};
            datas.userid = data.player.playuser;
            self.banker_event(datas, context);
        }

        cc.weijifen.audio.setSFXVolume(0);
        //重连判断action
        var istake = false;
        for (let i = 0; i < data.players.length; i++) {
            if (data.players[i].played || data.players[i].actions.length > 0) {
                istake = true;
            }
            if (data.players[i].ting) {
                let playerss = self.player(data.players[i].playuser, context);
                playerss.ting.active = true;
            }
            //判断谁是庄家
            if (data.players[i].banker == true) {
                var datas = {};
                datas.userid = data.players[i].playuser;
                self.banker_event(datas, context);
            }
        }

        //渲染自己的排面数据  
        var deskcards = data.player.played;
        if (deskcards || istake || data.player.actions.length > 0) {
            cc.sys.localStorage.setItem('cl', 'true');//重连状态设置为true
            if (deskcards) {
                //渲染已经打出去的牌面数据
                for (let i = 0; i < deskcards.length; i++) {
                    let desk_card = cc.instantiate(self.deskcard_one);//-----------------
                    let temp = desk_card.getComponent("DeskCard");
                    temp.init(deskcards[i], 'B');
                    context.deskcards.push(desk_card);
                    desk_card.parent = context._deskcardsNode.getChildByName('current');
                }
            }
            //渲染当前玩家   吃 碰 杠等数据
            var action = data.player.actions;
            self.actionCards(cc.weijifen.user.id, action, context, "current");

            if (data.player.ting) {//当前玩家状态为听牌状态
                let playerss = self.player(cc.weijifen.user.id, context);
                playerss.ting.active = true;
                cc.sys.localStorage.setItem('alting', 'true');
                cc.sys.localStorage.setItem('altings', 'true');
                cc.sys.localStorage.setItem('take', 'true')
                context.tingAction(true);
            }
            //打开当前回合出牌的方位大灯
            if (data.touchPlay) {
                let player = self.player(data.touchPlay, context)
                context.changeLight(player.tablepos, context);
                if (data.touchPlay == cc.weijifen.user.id) {
                    cc.sys.localStorage.setItem('take', 'true');
                }
            }
            //渲染其他玩家吃 碰 杠等数据
            for (let i = 0; i < data.players.length; i++) {
                var player = self.player(data.players[i].playuser, context);
                // 是否庄家，是否打牌
                if (!data.player.played && data.player.banker) {
                    cc.sys.localStorage.setItem('take', 'true');
                }
                if (data.players[i].actions.length > 0) {//其他玩家有吃碰杠
                    var action = data.players[i].actions;
                    self.actionCards(player.data.id, action, context, player.tablepos);
                }

                //其他玩家的打出去的牌    
                if (data.players[i].played) {
                    var deskcardss = data.players[i].played;
                    for (let j = 0; j < deskcardss.length; j++) {
                        self.initDeskCards(deskcardss[j], player.tablepos, context)
                    }
                }
            }
        }
        //当前玩家补花 data.player
        if (temp_player.buHua && temp_player.buHua.length) {
            var buhua = temp_player.buHua;
            let temp = self.player(temp_player.playuser, context);
            for (var i = 0; i < buhua.length; i++) {
                self.buhuaModle(buhua[i], temp.tablepos);
            }
        }

        //其他玩家补花 data.players
        for (var i = 0; i < data.players.length; i++) {
            if (data.players[i].buHua) {
                var buhua = data.players[i].buHua;
                let temp = self.player(data.players[i].playuser, context);
                for (var j = 0; j < buhua.length; j++) {
                    self.buhuaModle(buhua[j], temp.tablepos);
                }
            }
        }
        context.closeloadding();
        let baoNode = cc.find('Canvas/cards/otherCards/cardTip/baoCard');
        if (baoNode.children.length > 1 && cc.weijifen.GameBase.gameModel == 'ch') {
            if (baoNode.children[1]) baoNode.children[1].destroy();
        }
    },
    //渲染补花数据
    buhuaModle: function (cards, fangwei) {
        let opParent = cc.find("Canvas/cards/otherCards/huaCard/" + fangwei + "");
        var self = this;
        var card, temp;
        if (fangwei == 'top') {
            card = cc.instantiate(self.buhua_top);
        } else if (fangwei == 'left') {
            card = cc.instantiate(self.buhua_lef);
        } else if (fangwei == 'right') {
            card = cc.instantiate(self.buhua_right);
        } else {
            card = cc.instantiate(self.buhua_my);
        }
        temp = card.getComponent('BuHuaAction');
        temp.init(cards, fangwei);
        card.parent = opParent;
    },
    /*
        *渲染玩家吃 碰 杠 蛋 等数据 
        */
    actionCards: function (userId, action, context, weizhi) {//--------------------
        var gameEvent = cc.weijifen.gameEvent;
        for (let i = 0; i < action.length; i++) {
            var isGang = false, c;
            var cards = action[i].card;
            if (action[i].type == 'an') {
                isGang = true;
            }
            if (cards.length < 4 || isGang || action[i].action == 'gang' || action[i].action == 'peng' || action[i].action == 'chi') {
                if (action[i].action == 'gang' && cards.length == 1) {
                    let a = cards.concat(cards);
                    c = a.concat(a);
                } else {
                    function sortNumber(a, b) { return a - b }
                    c = cards.sort(sortNumber);
                }
                gameEvent.cardModle(c, isGang, weizhi, context, action[i].action);
            } else {
                c = cards.slice(0, 3);
                gameEvent.cardModle(c, isGang, weizhi, context, action[i].action);
                for (let h = 3; h < cards.length; h++) {
                    gameEvent.selectaction_event({ userid: userId, cards: [cards[h]], card: -1, action: 'dan' }, context);
                }
            }
        }
    },
    /**
        参数、人数、方位、mjdatabind、bool
        deskcard_right是回放时用到的，显示其他玩家的手牌
        这里需要分回放与否
        context.rightcards是玩家手牌。。。尚且不确定为何存其他玩家手牌。。
         */
    initPlayerHandCards: function (fangwei, context, cardsnum, cardarr) {
        if (fangwei == 'current') return;
        var self = cc.find('Canvas').getComponent('GameStartInit');
        let parent = context._allHandCardNode.getChildByName(fangwei).children[1];
        let cardarray = context.rightcards;
        let prefab, replay = cc.sys.localStorage.getItem('replayData');
        replay != null ? prefab = self.deskcard_right : prefab = self.handcard_right;
        if (fangwei == 'top') {
            cardarray = context.topcards;
            replay != null ? prefab = self.deskcard_one : prefab = self.handcard_top;
        } else if (fangwei == 'left') {
            cardarray = context.leftcards;
            replay != null ? prefab = self.deskcard_left : prefab = self.handcard_left;
        }
        for (var i = 0; i < cardsnum; i++) {
            let temp = cc.instantiate(prefab);
            if (cardarr && cardarr[i] && replay != null) {
                var src = temp.getComponent('DeskCard');
                src.init(cardarr[i], fangwei, true);
            }
            temp.parent = parent;
            cardarray.push(temp);
        }
    },
    player: function (pid, context) {//返回id对应的头像的mjplayer.js
        let player, arr = context.playersarray;
        for (var inx = 0; inx < arr.length; inx++) {
            let temp = arr[inx].getComponent("MJPlayer");
            if (temp.id.string == pid) {
                player = temp;
                break;
            }
        }
        if (player) {
            return player;
        }
    },
    /**
        * 初始化庄家手牌
        * @param  group   
        * @param  context 
        * @param  cards   
        * @param  banker  
        */
    initMjCards: function (context, cards) {
        let cards_panel = cc.find('Canvas/cards/handCards/current/handCards');
        for (var i = 0; i < cards.length; i++) {
            if (context.cardpool.size() > 0) {
                let temp = context.cardpool.get();
                let temp_script = temp.getComponent("HandCard");
                context.playercards.push(temp);
                temp_script.init(cards[i]);
                temp.parent = cards_panel;
            }
        }
    },
    /**
        * 此为恢复麻将状态  1、宽度 2、缩回来 3、颜色 
        * ting  true 为听牌时的状态
        */
    initcardwidth: function (ting) {
        let length = cc.find('Canvas/cards/handCards/current/handCards');
        for (let i = 0; i < length.childrenCount; i++) {
            let target = length.children[i];
            let card = target.getComponent('HandCard');
            card.take = false;
            if (cc.weijifen.cardNum > 14) {
                card.cardvalue.width = 67.5;
                card.cardvalue.height = 102.5;
                target.width = 65.5;
            } else {
                target.width = 93;
            }
            target.y = 0;
            //ting牌的时候 和 财神的牌是灰色的   听牌听完恢复 财神为持续状态
            if (!ting && !card.caishen && cc.sys.localStorage.getItem('ting') != 'true') {
                card.cardvalue.color = new cc.Color(255, 255, 255);
            }
        }
    },
    /**
   * 显示 剩余牌
   * @param start
   * @param end
   */
    showCardsCount: function (context, start, end) {
        start = start - 1;
        if (start > end && context._cardsCount) {
            context._cardsCount.string = start;
            let timer = setTimeout(function () {
                context.showCardsCount(context, start, end);
                clearTimeout(timer);
            }, 5);
        }
    },
    /*
   * 一局结束之后，在结算中点击‘继续’之后，重新初始化游戏
   */
    reinitGame: function (context) {
        var self = this;
        let arr = ['current', 'left', 'right', 'top'];
        self.tingnoaction();
        for (let i in arr) {
            self.destroycards(arr[i], context);
        }
        var array = context.playersarray;
        for (let i = array.length - 1; i > -1; i--) {
            let src = array[i].getComponent('MJPlayer');
            src.zhuangNode.active = false;
            src.ting.active = false;
            // context.playerspool.put(array[i]);//一句结束后会将所有头像框回收没有新建
        }
        cc.weijifen.powerCard = null;
        cc.sys.localStorage.removeItem('altake');
        cc.sys.localStorage.removeItem('alting');
        cc.sys.localStorage.removeItem('altings');
        cc.sys.localStorage.removeItem('guo');
        cc.sys.localStorage.removeItem('cb');
    },
    destroycards: function (fangwei, context) {//清楚并回收桌面的所有牌、补花数据
        let handcard = cc.find('Canvas/cards/handCards/' + fangwei + '/handCards');
        let deskcard = cc.find('Canvas/cards/deskCards/' + fangwei + '');
        let kong = cc.find('Canvas/cards/handCards/' + fangwei + '/kongCards');
        if (fangwei == 'current') {
            for (let i = handcard.childrenCount - 1; i > -1; i--) {//清空handcard
                let handcards = handcard.children[i].getComponent("HandCard");
                handcards.csImageTop.active = false;//--------------------
                handcards.node.zIndex = 0;
                handcards.node.getComponent(cc.Button).enabled = true;
                handcards.cardvalue.color = new cc.Color(255, 255, 255);
                handcards.reinit();
                context.cardpool.put(handcard.children[i]);
            }
            context.playercards = [];
        } else {
            if (handcard.children) handcard.removeAllChildren();
            if (fangwei == 'left') {
                context.leftcards = [];
            } else if (fangwei == 'right') {
                context.rightcards = [];
            } else {
                context.topcards = [];
            }
        }
        let buhuaList = cc.find('Canvas/cards/otherCards/huaCard/' + fangwei + '');
        if (buhuaList.children) buhuaList.removeAllChildren();//清空补花列表
        if (deskcard.children) deskcard.removeAllChildren();//清空桌面牌
        for (let i = 1; i < kong.childrenCount; i++) {//清空kongcard
            kong.children[i].destroy();
        }
    },
    tingnoaction: function () {//恢复所有将要回收的手牌的点击响应和颜色，利于重复利用
        let cards = cc.find('Canvas/cards/handCards/current/handCards');
        for (let i = 0; i < cards.childrenCount; i++) {
            let button = cards.children[i];
            let handCards = cards.children[i].getComponent("HandCard");
            handCards.cardvalue.color = new cc.Color(255, 255, 255);//-------------
            button.getComponent(cc.Button).interactable = true;
        }
        let selectting = cc.find('Canvas/other/tingSelectBg');
        if (selectting) {
            selectting.active = false;
            if (selectting.children) selectting.removeAllChildren();
        }
    },
    /*
    * 聊天窗口显示
    */
    chatInputShow: function () {
        let chat = cc.find('Canvas/chat');
        chat.active = !chat.active;
    },
    /*
    * 发送聊天文字
    */
    sendChatMsg: function (event) {
        let socket = this.socket();
        let chat = cc.find('Canvas/chat');
        let labels = cc.find("Canvas/chat/chatMsgBg/editBox");
        let label = labels.getComponent(cc.EditBox);
        let content = JSON.stringify({
            msg: label.placeholder,
            username: cc.weijifen.user.username
        })
        // type为文字
        let param = {
            type: 1,
            content: content
        }
        socket.emit("sayOnSound", JSON.stringify(param));
        label.string = "";
        label.placeholder = "输入些什么";
        chat.active = false;
    },
    /*
    * 发送表情信息
    */
    sendEmojiMsg: function (event) {
        let emoji = cc.find('Canvas/emoji');
        if (cc.weijifen.emjioUserId) {
            let socket = this.socket();
            var json = {
                targetId: cc.weijifen.emjioUserId,
                mineId: cc.weijifen.user.id,
                animationName: event.target.name
            };
            let content = JSON.stringify(json);
            // type为文字
            let param = {
                type: 2,
                content: content,
                userId: cc.weijifen.user.id

            }
            socket.emit("sayOnSound", JSON.stringify(param));
        }
        emoji.active = false;
    },
    initDeskCards: function (card, fangwei, context) {//主要是渲染右上左的deskcard
        var self = cc.find('Canvas').getComponent('GameStartInit');
        let prefabs = self.deskcard_one, m = 'B';
        if (fangwei == 'left') {
            prefabs = self.deskcard_left;
            m = 'L';
        } else if (fangwei == 'right') {
            prefabs = self.deskcard_right;
            m = 'R';
        }
        let desk_card = cc.instantiate(prefabs);
        let desk_script = desk_card.getComponent("DeskCard");
        desk_script.init(card, m);
        desk_card.parent = context._deskcardsNode.getChildByName(fangwei);
    },
    // update (dt) {},
});
