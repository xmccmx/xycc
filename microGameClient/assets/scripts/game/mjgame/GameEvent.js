// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

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
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },
    /**
           * 接受服务端的数据，玩家杠碰、吃胡等动作
           * @param data 包含事件信息
           * @param context
           */
    action_event: function (data, context) {
        /*
            定义一个全局变量

            1、收到事件就赋值
            2、在点过时初始化该值
            3、若没有点击过，而是直接出的牌，那么在出牌时进行判断。若变量有值就将其初始化，并向后端发送选择的事件
         */
        cc.weijifen.isGuo = 'meiguo';
        cc.weijifen.audio.setSFXVolume(parseInt(cc.weijifen.mp3Music));
        if (!data.dan) {
            clearTimeout(context.clock);
        }
        cc.sys.localStorage.setItem('altake', 'true');
        cc.sys.localStorage.removeItem('take');
        let gang, peng, chi, hu, guo, dan, ting;
        if (data.chis) {
            context.chis = data.chis;
            for (let i = 0; i < data.chis.length; i++) {
                context.chis[i].push(data.card);
            }
        } else {
            context.chis = [];
        }
        context.gangs = data["gangs"] ? data["gangs"] : [];
        context.dans = data["dans"] ? data["dans"] : [];
        context.tings = data["tings"] ? JSON.parse(data["tings"]) : [];
        var list = cc.find('Canvas/action');
        for (var inx = 0; inx < list.children.length; inx++) {
            let temp = list.children[inx];
            if (temp.name == "gang") { gang = temp; }
            if (temp.name == "dan") { dan = temp; }
            if (temp.name == "ting") { ting = temp; }
            if (temp.name == "hu") { hu = temp; }
            if (temp.name == "guo") { guo = temp; }
            if (temp.name == "peng") { peng = temp; }
            if (temp.name == "chi") { chi = temp; }
            temp.active = false;
        }
        if (data.deal == true) {  //发牌的动作
            if (data.ting) {
                cc.weijifen.receiveTing = true;
            }
            cc.sys.localStorage.setItem('guo', 'true');
            var count = 0;
            // 胡按钮出现
            if (data.hu) {
                hu.active = true;
                hu.x = -140 + count * 110;
                count++;
            }
            if (data.gang) {
                gang.active = true;
                gang.x = -140 + count * 110;
                count++;
            }
            if (data.dan) {
                dan.active = true;
                dan.x = - 140 + count * 110;
                count++;
            }
            if (data.ting) {
                ting.active = true;
                ting.x = - 140 + count * 110;
                count++;
            }
            if (data.deal) {
                guo.active = true;
                guo.x = - 140 + count * 110;
                count++;
            }
            list.x = (680 - count * 100);
            context.action123 = "deal";
        } else {
            var count = 0;
            if (data.hu) {
                hu.active = true;
                hu.x = - 140 + count * 110
                count++;
            }
            if (data.gang) {
                gang.active = true;
                gang.x = - 140 + count * 110
                count++;
            }
            if (data.peng) {
                peng.active = true;
                peng.x = - 140 + count * 110
                count++;
            }
            if (data.chi) {
                chi.active = true;
                chi.x = - 140 + count * 110
                count++;
            }
            if (!data.deal && !data.action) {
                guo.active = true;
                guo.x = - 140 + count * 110
                count++;
            }
            list.x = (770 - count * 100);
        }
    },
    selectaction_event: function (data, context) {
        cc.weijifen.audio.setSFXVolume(parseInt(cc.weijifen.mp3Music));
        if (cc.find('Canvas/showTakeCardPanel').children) {
            cc.find('Canvas/showTakeCardPanel').removeAllChildren();
        }
        var gameStartInit = cc.weijifen.gameStartInit;
        var gameEvent = cc.weijifen.gameEvent;
        var gameModelMp3 = "";//播放声音

        //触发音效        
        let player = gameStartInit.player(data.userid, context);
        if (cc.weijifen.GameBase.gameModel == "wz") {
            gameModelMp3 = "wz";
            cc.weijifen.genders[player.tablepos] = '';
            cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + data.action + cc.weijifen.genders[player.tablepos]);
        } else {
            cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + data.action + '_' + cc.weijifen.genders[player.tablepos]);
        }
        let jiantou;
        if (data.target) {
            jiantou = gameStartInit.player(data.target, context).tablepos;
        }
        context.changeLight(player.tablepos, context);
        /**
         * 杠碰吃，胡都需要将牌从 触发玩家的 桌牌 里 移除，然后放入当前玩家 桌牌列表里，如果是胡牌，则放到 胡牌 列表里，首先
         * 首先，需要找到触发对象，如果触发对象不是 all ， 则 直接找到 对象对应的玩家 桌牌列表，并找到 桌牌里 的最后 的 牌，
         * 然后将此牌 移除即可，如果对象是 all， 则不用做任何处理即可
         */

        if (cc.weijifen.user.id == data.userid) {
            if (cc.sys.localStorage.getItem('cb') != 'true') {
                cc.sys.localStorage.setItem('take', 'true');
            }
            /**
             * 碰，显示碰的动画，
             * 杠，显示杠的动画，杠分为：明杠，暗杠，弯杠，每种动画效果不同，明杠/暗杠需要扣三家分，弯杠需要扣一家分
             * 胡，根据玩法不同，推倒胡和血流/血战
             */
            if (data.target == "all") {
                let rightpre = cc.instantiate(context.action_gang_ming_prefab);
                rightpre.parent = context.deskcards_right_panel.parent;
                let toppre = cc.instantiate(context.action_gang_ming_prefab);
                toppre.parent = context.deskcards_top_panel.parent;
                let leftpre = cc.instantiate(context.action_gang_ming_prefab);
                leftpre.parent = context.deskcards_left_panel.parent;
            } else {
                //碰的特效
                context.changeLight(player.tablepos, context);
                context.changeStatu("nextplayer", context);
            }
            gameEvent.handCardRemove(data, context);//碰、点杠等情况只有data.card的情况需要处理。
        }
        // 显示杠、吃、碰动画
        let actionName = data.action;
        if (actionName == "dan") {
            actionName = "gang";
        }
        let img = cc.find("Canvas/animations");//action动画，最后弄
        img.active = true;
        var imgAnim = img.getComponent(cc.Animation);
        if (player.tablepos == 'top') {
            img.x = 0;
            img.y = 160;
        } else if (player.tablepos == 'left') {
            img.x = -320;
            img.y = 0;
        } else if (player.tablepos == 'right') {
            img.x = 320;
            img.y = 0;
        } else {
            img.x = 0;
            img.y = -160;
        }
        img.width = 128;
        img.height = 128;
        if (imgAnim != null) {
            imgAnim.play(actionName);
        }
        setTimeout(function () {
            img.active = false;
        }, 2000)
        gameEvent.otherHandCardRemove(data, context, player.tablepos);
        let opCards, back = false;
        if (data.action == 'chi') {
            function sortNumber(a, b) { return a - b }
            data.cards.sort(sortNumber);
            data.cards.splice(1, 0, data.card);
            opCards = data.cards;
        } else if (data.action == 'peng') {
            data.cards.push(data.card);
            opCards = data.cards;
            // 自己蛋牌被别人抢碰
            if (cc.weijifen.danOrPeng && cc.weijifen.danOrPengData.userid == cc.weijifen.user.id) {
                cc.weijifen.gamePlay.takecard_event(cc.weijifen.danOrPengData, context, true);
            }
        } else if (data.action == 'gang') {
            if (data.card && data.card != -1) {
                data.cards.push(data.card);
            }
            if (data.actype == 'an') {
                back = true;
            }
            opCards = data.cards;
        } else if (data.action == 'dan') {
            opCards = data.cards;
        }
        gameEvent.cardModle(opCards, back, player.tablepos, context, data.action, jiantou);//jiantou是action事件的目标方位
        if (cc.sys.localStorage.getItem('cb') != 'true' && (data.action == 'peng' || (data.action == 'gang' && data.card != -1) || data.action == 'chi' || data.action == 'hu')) {
            //以下代码是用于找到 杠/碰/吃/胡牌的 目标牌  ， 然后将此牌 从 桌面牌中移除
            if (cc.sys.localStorage.getItem("replayData") != null && data.target == data.userid) {
                return;
            }
            let deskcardpanel = context._deskcardsNode.getChildByName(jiantou);
            if (deskcardpanel.children.length > 0) {
                deskcardpanel.children[deskcardpanel.children.length - 1].destroy();
            }
        }
    },
    handCardRemove: function (data, context) {//出牌后从手牌中移出该牌,action相关的牌从手牌中移出
        if (data.cards) {
            for (let i = 0; i < data.cards.length; i++) {
                for (let inx = 0; inx < context.playercards.length; inx++) {
                    let temp = context.playercards[inx].getComponent("HandCard");
                    if (data.cards[i] == temp.value) {
                        context.cardpool.put(context.playercards[inx]);
                        context.playercards.splice(inx, 1);
                    }
                }
            }
        }
        if (data.card != -1) {
            for (var inx = 0; inx < context.playercards.length;) {
                let temp = context.playercards[inx].getComponent("HandCard");
                if (data.card == temp.value) {
                    context.cardpool.put(context.playercards[inx]);
                    context.playercards.splice(inx, 1);
                    break;
                } else {
                    inx++;
                }
            }
        }
    },
    otherHandCardRemove: function (data, context, tablepos) {//其他玩家出牌后从手牌中移出该牌
        if (cc.sys.localStorage.getItem("replayData") != null || tablepos == 'current') {
            return;
        }
        var par = cc.find('Canvas/cards/handCards/' + tablepos + '/handCards');
        var arr;
        if (tablepos == 'top') arr = context.topcards;//存放其他玩家手牌的数组
        if (tablepos == 'right') arr = context.rightcards;
        if (tablepos == 'left') arr = context.leftcards;
        for (let i = 0; i < data.cards.length; i++) {
            if (par.children) {
                par.children[i].destroy();
                arr.splice(i, 1);
            }
        }
    },
    /**
       * 点击事件按钮之后，蛋牌
       * @param  {Array}   cards   操作的牌值
       * @param  {cc.Node} parent  挂载的节点
       * @param  {Boolean} back    
       * @param  {String}  fangwei 
       * @param  {cc.Node} context
       * @param  {String}  action  
       * @param  {String}  target  
       * @param  {Array}   action_data 事件数据
       */
    cardModle: function (cards, back, fangwei, context, action, jiantou) {//找到action.card对应的节点将其放入进去或增加计数
        var gameEventNode = cc.find('Canvas/bg').getComponent('GameEvent');
        let gameStartInit = cc.find('Canvas').getComponent('GameStartInit');
        // 蛋
        var card, temp, K;
        if (fangwei == 'top' || fangwei == 'current') {
            card = cc.instantiate(gameStartInit.deskcard_one);
            K = 'B';
        } else if (fangwei == 'left') {
            card = cc.instantiate(gameStartInit.deskcard_left);
            K = 'L';
        } else if (fangwei == 'right') {
            card = cc.instantiate(gameStartInit.deskcard_right);
            K = 'R';
        }
        temp = card.getComponent('DeskCard');
        if (cards.length == 1) {
            var cardOp = gameEventNode.findCardForKong(cards[0], action, fangwei);//得到action的对应节点和isgang和对应节点子集下标
            // 1、将当前值转化为牌值类型和名字
            var cardName;
            var cardcolors = parseInt(cards[0] / 4);
            var cardtype = parseInt(cardcolors / 9);
            var arr = ['_wind_east', '_wind_south', '_wind_west', '_wind_north', '_red', '_green', '_white', '_character_', '_dot_', '', '_bamboo_'];
            if (cardcolors < 0) {
                cardName = K + arr[cardcolors + 7];
            } else {
                cardName = K + arr[cardtype + 7] + (parseInt((cards[0] % 36) / 4) + 1);
            }

            // 3、kongcard中查找蛋牌
            if (cardOp.cardNode) {
                var cardValues = cardOp.cardNode.children;//即将放入的card节点
                var bol = true;
                if (fangwei == 'current') {
                    card.scale = 1.5;
                    card.width = 62;
                }
                if (71 < cards[0] && cards[0] < 76) {
                    card.zIndex = 999;
                } else {
                    if (cards[0] >= 0) {
                        card.zIndex = cards[0];
                    } else {
                        card.zIndex = cards[0] + 200;
                    }
                }
                for (var j = 0; j < cardValues.length; j++) {//将action的card的对应name
                    if (cardOp.isGang) {
                        bol = false;
                        temp.init(cards[0], fangwei, true);
                        card.parent = cardOp.cardNode;
                        temp.kongCardInit(action);//新增的actioncard添加标记
                        cardOp.cardNode.sortAllChildren();
                        break;
                    }
                    let src = cardValues[j].getComponent('DeskCard');
                    if (src.cardcolor == cardcolors) {
                        bol = false;
                        src.count.string = Number(Number(src.count.string) + 1);//不是刚且牌面一致，则为蛋计数++
                        src.countactive();
                        break;
                    }
                }
                if (bol) {
                    temp.init(cards[0], fangwei, true);
                    card.parent = cardOp.cardNode;
                    temp.kongCardInit(action);//新增的actioncard添加标记
                    cardOp.cardNode.sortAllChildren();
                }
            }
            // 4、蛋牌自身去重
            if (action != 'gang' && cardValues) {//单张dan牌已被添加到cardValues的第一个，一条一万一条一条，第一个为新加入的，所以n中的为起始3张蛋牌中的牌，如果是1条则有double1tiao
                // 蛋牌去重
                for (var i = 0; i < cardValues.length; i++) {
                    var n = [];
                    var node1 = cardValues[i];
                    var scr1 = node1.getComponent('DeskCard');
                    for (var j = 0; j < cardValues.length; j++) {
                        if (i != j && cardValues[j]) {
                            var node2 = cardValues[j];
                            var src2 = node2.getComponent('DeskCard');
                            if (scr1.cardName == src2.cardName && !src2.double1tiao) {
                                n.push(j);
                            }
                        }
                    }
                    if (n.length > 0) {
                        let sr = cardValues[n[0]].getComponent('DeskCard');
                        if (sr.double1tiao) {//查到的重复牌为1条  当第一次蛋3张牌中有两个蛋牌时  查重查到的就需要少处理一个
                            //只需要判断第一次蛋牌中是否有两张1条  
                            n.splice(0, 1);
                        }
                        for (let p = 0; p < n.length; p++) {
                            let src = cardValues[n[p]].getComponent('DeskCard');
                            let num = Number(src.count.string);
                            if (num == 0 || num < 0) num = 1;
                            scr1.count.string = Number(scr1.count.string) + num;
                            scr1.countactive();
                        }
                        for (let u = n.length - 1; u > -1; u--) {
                            cardValues.splice(n[u], 1);
                        }
                    }
                }
            }
        } else {
            let kongnode = cc.find('Canvas/cards/handCards/' + fangwei + '/kongCards');
            let cardParent = cc.instantiate(kongnode.children[0]);
            let n = 0;
            for (let i = 0; i < cards.length; i++) {
                if (cards[i] != undefined) {
                    let kongcard = cc.instantiate(card);
                    let kongcardSrc = kongcard.getComponent('DeskCard');
                    // 暗杠第三张牌显示花色
                    if (i == 2 && back == true && fangwei != 'right' && fangwei != 'top' && fangwei != 'left') {
                        kongcardSrc.init(cards[i], fangwei);//原本DanCard中的init---------------
                    } else if (action != 'dan' && i == 1 && back != true) {
                        kongcardSrc.init(cards[i], fangwei, jiantou);
                    } else {
                        kongcardSrc.back = back;
                        kongcardSrc.init(cards[i], fangwei);
                    }
                    if (71 < cards[i] && cards[i] < 76 && action != 'chi') {
                        kongcard.zIndex = 999;
                        kongcardSrc.double1tiao = false;
                        n++;
                    } else {
                        if (cards[i] >= 0) {
                            kongcard.zIndex = cards[i];
                        } else {
                            kongcard.zIndex = cards[i] + 200;
                        }
                    }
                    if (fangwei == 'current') {
                        kongcard.scale = 1.5;
                        kongcard.width = 62;
                    }
                    kongcard.parent = cardParent;
                    kongcardSrc.kongCardInit(action);
                    //马上进行排序如果不这个方法 会在所有方法执行完后再排序---官方排序方法
                    cardParent.sortAllChildren();
                }
            }
            if (n == 2) {
                for (let j = 0; j < cardParent.childrenCount; j++) {
                    let s = cardParent.children[j].getComponent('DeskCard');
                    if (s.cardcolor == 18) {
                        s.double1tiao = true;//记录蛋牌中起始3牌中有俩蛋牌
                    }
                }
            }
            cardParent.parent = kongnode;
        }
    },
    findCardForKong: function (card, action, fangwei) {//主要用到DanAction脚本中的action和type（事件类型和事件名）以及牌面、牌类型和cardcolor，将这些都归入到DeskCard中
        var resNode, isGang, cardNum, kong;
        kong = cc.find("Canvas/cards/handCards/" + fangwei + "/kongCards");
        //遍历整个kong 的子集  cards、
        for (let i = 1; i < kong.children.length; i++) {
            var cards = kong.children[i];//存放每个蛋、碰等的牌组节点
            var kcards = cards.children[0].getComponent('DeskCard');
            var kaction = kcards.action;//获取 事件
            var type = kcards.type; //获取类型  当为dan 事件时用来判定
            var cardcolors = parseInt(card / 4);
            var cardtype = parseInt(cardcolors / 9);
            var cardface = (parseInt((card % 36) / 4));
            var dans = cards.children;
            //当这个牌是妖姬时
            if (cardtype == 2 && cardface == 0 && cards.children.length > 0 && type != 'yao' && action == 'dan' && kaction == 'dan') {
                resNode = cards;
                cardNum = 0;
                isGang = true;
                break;
                //当这个牌不是妖姬时
            } else {
                //cards是peng   action 为gang时
                if (action == 'gang' && dans.length > 0 && kaction == 'peng') {
                    for (let j = 0; j < dans.length; j++) {
                        var cardUnit = dans[j].getComponent("DeskCard");
                        if ((cardface == cardUnit.cardface && cardtype == cardUnit.cardtype) || (card < 0 && cardcolors == cardUnit.cardcolor)) {
                            resNode = cards;
                            cardNum = j;
                            isGang = true;
                            break;
                        }
                    }
                    //当action 为dan
                } else if (action == kaction && dans.length > 0) {
                    isGang = false;
                    //有两种情况  一种长度为4 和长度为3   
                    for (let j = 0; j < dans.length; j++) {
                        var script = dans[j].getComponent("DeskCard");
                        if (dans.length == 3 && type == 'wind' && cardcolors >= -7 && cardcolors <= -4) {
                            isGang = true;
                            for (let h = 0; h < dans.length; h++) {
                                if (cardcolors == dans[h].getComponent("DeskCard").cardcolor) {
                                    isGang = false;
                                    resNode = cards;
                                    cardNum = h;
                                    break;
                                }
                                resNode = cards;
                                cardNum = h;
                            }
                            break;
                        } else if (card < 0 && ((type == 'wind' && cardcolors >= -7 && cardcolors <= -4) || (type == 'xi' && cardcolors >= -3 && cardcolors <= -1))) {
                            if (cardcolors == script.cardcolor) {
                                resNode = cards;
                                cardNum = j;
                                break;
                            } else if (script.cardtype == 2 && script.cardface == 0) {//一万
                                script.setValue(card);
                                resNode = cards;
                                cardNum = j;
                                break;
                            }
                        } else if (card > 0 && ((type == 'yao' && cardface == 0) || (type == 'jiu' && cardface == 8))) {
                            if (cardface == script.cardface && script.cardtype == cardtype) {
                                resNode = cards;
                                cardNum = j;
                                break;
                            } else if (script.cardtype == 2 && script.cardface == 0) {
                                script.setValue(card);
                                resNode = cards;
                                cardNum = j;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return { cardNode: resNode, isGang: isGang, cardNum: cardNum };
    },
    //原先gameover.js，现整合到event.js中，  有玩家胡的时候接到，显示胡动画，并渲染结算panel
    allcards_event: function (data, context) {
        var gameStartInit = cc.weijifen.gameStartInit;
        let id, id1;
        // 胡动画
        if (!data.unHu) {
            for (let i = 0; i < data.playOvers.length; i++) {
                if (data.playOvers[i].win) {
                    id = data.playOvers[i].user;
                }
                if (data.playOvers[i].balance.drop) {
                    id1 = data.playOvers[i].user;
                }
            }
            var player = gameStartInit.player(id, context);
            var player1 = gameStartInit.player(id1, context);
            if (cc.weijifen.GameBase.gameModel == "wz") {
                cc.weijifen.genders[player.tablepos] = '';
                cc.weijifen.audio.playSFX('nv/' + 'wz' + 'hu' + cc.weijifen.genders[player.tablepos]);
            } else {
                cc.weijifen.audio.playSFX('nv/' + 'hu_' + cc.weijifen.genders[player.tablepos]);
            }
            //-----------------胡动画
            var hu = cc.find("Canvas/animations");
            hu.active = true;
            if (player.tablepos == 'top') {
                hu.x = 280;
                hu.y = 200;
            } else if (player.tablepos == 'left') {
                hu.x = -400;
                hu.y = 80;
            } else if (player.tablepos == 'right') {
                hu.x = 400;
                hu.y = 80;
            } else {
                hu.x = -450;
                hu.y = -200;
            }
            let anim = hu.getComponent(cc.Animation);
            anim.play('hu');
            let huTime = setTimeout(function () {
                hu.active = false;
                if (cc.find('Canvas/showTakeCardPanel').children) {
                    cc.find('Canvas/showTakeCardPanel').removeAllChildren();
                }
                clearTimeout(huTime);
            }, 2000);
        }
        function weizhi(player, img) {
            img.width = 448;
            img.height = 168;
            if (player.tablepos == 'top') {
                img.x = 0;
                img.y = 160;
            } else if (player.tablepos == 'left') {
                img.x = -320;
                img.y = 0;
            } else if (player.tablepos == 'right') {
                img.x = 320;
                img.y = 0;
            } else {
                img.x = 0;
                img.y = -160;
            }
        }
        var gameEvent = cc.find('Canvas/bg').getComponent('GameEvent');
        //结算界面，
        let playerid;
        cc.sys.localStorage.removeItem('clear');
        // for (let i = 0; i < data.playOvers.length; i++) {
        // if (data.playOvers[i].balance) {
        //     if (data.playOvers[i].balance.drop) {// 点炮
        //         let anim = cc.find('Canvas/dianpao');
        //         anim.width = 448;
        //         anim.height = 168;
        //         if (player1.tablepos == 'top') {
        //             anim.x = 0;
        //             anim.y = 160;
        //         } else if (player1.tablepos == 'left') {
        //             anim.x = -320;
        //             anim.y = 0;
        //         } else if (player1.tablepos == 'right') {
        //             anim.x = 320;
        //             anim.y = 0;
        //         } else {
        //             anim.x = 0;
        //             anim.y = -160;
        //         }
        //         anim.active = true;
        //         anim = anim.getComponent(cc.Animation);
        //         anim.play('dianpao');
        //         let time = setTimeout(function () {
        //             cc.find('Canvas/dianpao').active = false;
        //             clearTimeout(time);
        //         }, 4000)
        //     } else if (data.playOvers[i].balance.chongBao || data.playOvers[i].balance.moBao) {// 冲宝
        //         let anim = cc.find('Canvas/chongbao');
        //         weizhi(player, anim);
        //         anim.active = true;
        //         anim = anim.getComponent(cc.Animation);
        //         anim.play('chongbao');
        //         cc.log('chongbao');
        //         let time = setTimeout(function () {
        //             clearTimeout(time);
        //             cc.find('Canvas/chongbao').active = false;
        //         }, 4000)
        //     } else {
        //         if (data.playOvers[i].balance.zimo) {// 自摸
        //             let anim = cc.find('Canvas/zimo');
        //             weizhi(player, anim);
        //             anim.active = true;
        //             anim = anim.getComponent(cc.Animation);
        //             anim.play('zimo');
        //             cc.log('zimo')
        //             let time = setTimeout(function () {
        //                 cc.find('Canvas/zimo').active = false;
        //                 clearTimeout(time);
        //             }, 4000);
        //         }
        //     }
        // }
        // if (data.playOvers[i].win == true) {
        //     playerid = data.playOvers[i].user;
        //     if (data.playOvers[i].balance.huCard > -32) {
        //         var dan = gameOverNode.current_hu.children[1].getComponent('DeskCard');
        //         dan.init(data.playOvers[i].balance.huCard, false, 'current', '1');
        //     } else {
        //         gameOverNode.current_hu.children[1].active = false;
        //         gameOverNode.top_hua.active = true;
        //         var dan = gameOverNode.top_hua.getComponent('BuHuaAction');
        //         dan.init(data.playOvers[i].balance.huCard, '', false);
        //     }
        // }
        // }
        // gameEvent.huaction(playerid);//胡牌时头像放大，胡牌动画
        setTimeout(function () { gameEvent.endList(data, context, playerid, gameEvent) }, 2500);
        cc.find('Canvas/cards/handCards/banHandcardClick').active = false;//关闭手牌点击影响panel
    },
    /*
       * 结算列表
       * @param data       结算数据
       * @param context    上下文（这里指mjdatabind组件节点）
       * @param playerid   赢家id
       */
    endList: function (data, context, playerid, obj) {
        var cardNum = cc.find('Canvas/cards/otherCards/cardTip/numLabel').getComponent(cc.Label);
        context.gddesk_cards = cardNum.string;
        cardNum.string = '136';
        var settingnode = cc.find('Canvas/bg').getComponent('settingClick');
        let temp = cc.instantiate(settingnode.summary);
        temp.parent = cc.find('Canvas');
        temp.getComponent('SummaryClick').init(data);
        temp.zIndex = 9999;
        if (playerid) {
            obj.huaction2(playerid, context);
        }
    },
    /*
       * 胡牌处理
       */
    huaction: function (playerid) {
        if (playerid) {
            let player = cc.weijifen.gameStartInit.player(playerid, this);
            let action = cc.scaleTo(1.5, 1.5);
            player.node.runAction(action);// 胡牌玩家头像，放大
        }
    },
    huaction2: function (playerid, context) {
        let player = cc.weijifen.gameStartInit.player(playerid, context);
        player.node.scale = 1;
    },
    onClick: function (event) {//action事件btn的点击事件
        if (cc.find('Canvas/showTakeCardPanel').children) {
            cc.find('Canvas/showTakeCardPanel').removeAllChildren();
        }
        this.node.dispatchEvent(new cc.Event.EventCustom(event.target.name, true));
    },
    //action选择界面closebtn点击事件
    actionSelectPanelClose() {
        let self = this;
        cc.find('Canvas/other/actionSelectBg').active = false;
        cc.find('Canvas/other/actionSelectBg/layout/kanSelect').removeAllChildren();
        self.node.dispatchEvent(new cc.Event.EventCustom('guo', true));
        cc.sys.localStorage.setItem('take', 'true');
    },
    // update (dt) {},
});
