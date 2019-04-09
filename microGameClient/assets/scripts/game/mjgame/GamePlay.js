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
    lasthands_event: function (data, context) {//下一个出牌的玩家，灯罩住
        if (data.userid == cc.weijifen.user.id) {    //该我出牌 , 庄家出牌，可以不用判断是否庄家了 ，不过，庄家数据已经传过来了
            context.changeStatu("lasthands", context);
            context.changeLight("current", context);
            if (cc.sys.localStorage.getItem('altake') != 'true') {
                cc.sys.localStorage.setItem('take', 'true');
            }
        } else {
            context.changeStatu("otherplayer", context);    //当前玩家出牌，计时器开始计时，探照灯照向该玩家
            for (var inx = 0; inx < context.playersarray.length; inx++) {
                let temp = context.playersarray[inx].getComponent("MJPlayer");
                if (temp.data.id == data.userid) {
                    context.changeLight(temp.tablepos, context); break;
                }
            }
        }
    },
    /**
            * 出牌
            * 新创建牌局，首个玩家加入，进入等待状态，等待其他玩家加入，服务端会推送 players数据
            * @param {Object} data  
            * @param {cc.Component} context
            * @param {Boolean} peng    玩家蛋牌被其他玩家抢碰
            */
    takecard_event: function (data, context, peng) {
        cc.weijifen.audio.setSFXVolume(parseInt(cc.weijifen.mp3Music));
        clearTimeout(context.clock);
       
        cc.weijifen.clock = null;
        var gameStartInit = cc.weijifen.gameStartInit;
        var gameStartInitNode = cc.find('Canvas').getComponent('GameStartInit');
        cc.sys.localStorage.removeItem('cb');
        cc.weijifen.audio.playSFX('give');
        let playerss = gameStartInit.player(data.userid, context);
        // 蛋牌被抢碰之后的手牌处理
        if (!data.cards) {
            cc.weijifen.danOrPeng = true;
            cc.weijifen.danOrPengData = data;
            if (peng) {
                for (let inx = 0; inx < context.playercards.length; inx++) {
                    let handcards = context.playercards[inx].getComponent("HandCard");
                    handcards.reinit();
                    if (data.card == handcards.value) {
                        context.playercards[inx].zIndex = 0;
                        context.playercards[inx].parent = null;

                        context.cardpool.put(context.playercards[inx]);
                        context.playercards.splice(inx, 1);
                        let desk_card = cc.instantiate(gameStartInitNode.deskcard_one);
                        let temp = desk_card.getComponent("DeskCard");
                        temp.init(handcards.value, 'B', undefined, 'current');

                        desk_card.active = false;
                        desk_card.children[0].children[0].width = 90;//122
                        desk_card.children[0].children[0].height = 128;//150
                        context.deskcards.push(desk_card);
                        desk_card.parent = context.deskcards_current_panel;
                    } else {
                        if (handcards.selectcolor == true) {
                            context.playercards[inx].zIndex = 1000 + handcards.value;
                        } else {
                            if (handcards.value >= 0) {
                                context.playercards[inx].zIndex = handcards.value;
                            } else {
                                context.playercards[inx].zIndex = 200 + handcards.value;
                            }

                            if (context.playercards[inx].children[1].active) {
                                context.playercards[inx].zIndex = -1;
                            }
                        }    //遍历 ++,不处理移除的 牌
                    }
                }

                cc.weijifen.danOrPeng = null;
                cc.weijifen.danOrPengData = null;
                return
            }
        }
        if (data.ting) {
            if (playerss.ting.active == false) {
                playerss.ting.active = true;
                var anim = cc.find("Canvas/animations");
                if (playerss.tablepos == 'top') {
                    anim.x = 280;
                    anim.y = 200;
                } else if (playerss.tablepos == 'left') {
                    anim.x = -400;
                    anim.y = 80;
                } else if (playerss.tablepos == 'right') {
                    anim.x = 400;
                    anim.y = 80;
                } else {
                    anim.x = -450;
                    anim.y = -200;
                }
                anim.active = true;
                anim = anim.getComponent(cc.Animation);
                anim.play('ting');
                setTimeout(function () {
                    cc.find('Canvas/animations').active = false;
                }, 2000);
            }
        }
        if (data.userid == cc.weijifen.user.id) {//接到出牌消息了，就需要将出牌相关提示关闭：听牌选择、蛋牌选择、牌的高度
            if (!data.ting) {
                gameStartInit.tingnoaction();
            }
            let father = cc.find('Canvas/other/actionSelectBg');
            if (father.active == true) {
                father.active = false;
                if (father.children[0].children[0].children) father.children[0].children[0].removeAllChildren();
            }
            gameStartInit.initcardwidth();

            if (data.ting) {//听牌了，将选择听牌panel里的牌都清除
                cc.sys.localStorage.setItem('alting', 'true');
                cc.sys.localStorage.setItem('altings', 'true');
                cc.sys.localStorage.setItem('take', 'true');
                var selectting = cc.find('Canvas/other/tingSelectBg');
                if (selectting && selectting.children) selectting.removeAllChildren();
            } else {
                cc.sys.localStorage.removeItem('alting');
            }
            if (data.notSend || (cc.sys.localStorage.getItem('take') != 'true' && !data.allow)) {
                if (cc.sys.localStorage.getItem("replayData") == null) {
                    return;
                }
            }
            cc.sys.localStorage.removeItem('altake');
            cc.sys.localStorage.removeItem('take');
            let h_cards = cc.find('Canvas/cards/handCards/current/handCards');
            for (var inx = 0; inx < context.playercards.length; inx++) {
                let handcards = context.playercards[inx].getComponent("HandCard");
                handcards.reinit();
                if (data.card == handcards.value) {
                    context.playercards[inx].zIndex = 0;
                    context.playercards[inx].parent = null;
                    context.cardpool.put(context.playercards[inx]);
                    context.playercards.splice(inx, 1);
                    let desk_card = cc.instantiate(gameStartInitNode.deskcard_one);
                    let temp = desk_card.getComponent("DeskCard");
                    temp.init(handcards.value, 'B', undefined, 'current');

                    let big_card = cc.instantiate(context.handcardPrefab);
                    let big_handcards = big_card.getComponent("HandCard");
                    big_handcards.init(handcards.value, 'B');
                    if (cc.weijifen.cardPostion) {
                        big_card.x = cc.weijifen.cardPostion.x;
                        big_card.y = cc.weijifen.cardPostion.y;
                        cc.weijifen.cardPostion = { x: null, y: null };
                    }
                    if (data.ting) {
                        var newVec2 = h_cards.children[h_cards.childrenCount - 1].convertToNodeSpaceAR(cc.v2(667, 375));
                        big_card.x = -newVec2.x;
                        big_card.y = -newVec2.y;
                    }
                    big_card.parent = cc.find('Canvas/showTakeCardPanel');
                    let move = cc.moveTo(0.3, cc.v2(0, -150));
                    big_card.runAction(move);

                    desk_card.active = false;
                    desk_card.children[0].children[0].width = 90;//122
                    desk_card.children[0].children[0].height = 128;//150
                    context.deskcards.push(desk_card);
                    desk_card.parent = cc.find('Canvas/cards/deskCards/current');
                } else {
                    handcards.reinit();
                    if (handcards.selectcolor == true) {
                        context.playercards[inx].zIndex = 1000 + handcards.value;
                    } else {
                        if (handcards.value >= 0) {
                            context.playercards[inx].zIndex = handcards.value;
                        } else {
                            context.playercards[inx].zIndex = 200 + handcards.value;
                        }

                        if (context.playercards[inx].children[1].active) {
                            context.playercards[inx].zIndex = -1;
                        }
                    }   //遍历 ++,不处理移除的 牌
                }
            }
            h_cards.sortAllChildren();
            // context.changeStatu("takecard", context);  //隐藏 提示状态
        } else {
            // 碰牌玩家执行该处代码
            cc.sys.localStorage.removeItem('take');
            //其他玩家出牌   
            let cardpanel, prefab, move, m, h, w, x, y;
            if (!data.notSend && playerss) {
                if (playerss.tablepos == "right") {
                    cardpanel = context._handCardNode.right;
                    prefab = gameStartInitNode.deskcard_right;
                    x = 380; y = 0; m = 'R'; w = 128; h = 100;
                    move = cc.moveTo(0.2, cc.v2(320, 0));
                } else if (playerss.tablepos == "left") {
                    cardpanel = context._handCardNode.left;
                    prefab = gameStartInitNode.deskcard_left;
                    x = -380; y = 0; m = 'L'; w = 128; h = 100;
                    move = cc.moveTo(0.2, cc.v2(-320, 0));
                } else if (playerss.tablepos == "top") {
                    cardpanel = context._handCardNode.top;
                    prefab = gameStartInitNode.deskcard_one;
                    x = 0; y = 250; m = 'B'; w = 90; h = 128;
                    move = cc.moveTo(0.2, cc.v2(0, 160));
                }
                let desk_card = cc.instantiate(prefab);
                let temp = desk_card.getComponent("DeskCard");
                temp.init(data.card, m, undefined, temp.tablepos);
                let big_card = cc.instantiate(context.handcardPrefab);
                let big_handcards = big_card.getComponent("HandCard");
                big_handcards.init(data.card, m);
                big_card.x = x;
                big_card.y = y;
                big_card.parent = cc.find('Canvas/showTakeCardPanel');
                big_card.runAction(move);
                desk_card.active = false;
                desk_card.children[0].children[0].width = w;
                desk_card.children[0].children[0].height = h;
                context.deskcards.push(desk_card);
                desk_card.parent = context._deskcardsNode.getChildByName(playerss.tablepos);
                /**
                 * 销毁其中一个对象
                 */
                var replay = cc.sys.localStorage.getItem('replayData');
                if (!replay) {
                    if (cardpanel.children[cardpanel.children.length - 1]) cardpanel.children[cardpanel.children.length - 1].destroy();
                }
            }
        }
    },
    /**
      * 下一个玩家抓牌的事件， 如果上一个玩家出牌后，没有其他玩家杠、碰、吃、胡等动作，则会同时有一个抓牌的事件，否则，会等待玩家 杠、碰、吃、胡完成
      * @param data
      * @param context
      */
    dealcard_event: function (data, context) {
        cc.weijifen.audio.setSFXVolume(parseInt(cc.weijifen.mp3Music));
        if (data.replacePowerCard) {
            var tip = cc.find('Canvas/AllTips/changeBaoCard');
            tip.active = true;
            setTimeout(function () {
                tip.active = false;
            }, 1500);
        }
        var handCards = cc.find('Canvas/cards/handCards/current/handCards');
        var length = handCards.childrenCount;
        //玩家最后一张牌就是摸到的，已经隔出距离了，现在又摸牌，就将原来那张排序、去掉间隔
        if (length > 3 && cc.weijifen.user.id == data.userid && handCards.children[length - 1].zIndex == 2000) {
            let val = handCards.children[length - 1].getComponent('HandCard').value;
            val > -1 ? handCards.children[length - 1].zIndex = val
                : handCards.children[length - 1].zIndex = val + 200;
            handCards.sortAllChildren();
        }

        context.clock = setTimeout(function () {//这个就是出牌效果中，删掉悬在桌上的牌
            if (cc.find('Canvas/showTakeCardPanel').children) {
                cc.find('Canvas/showTakeCardPanel').removeAllChildren();
            }
            var arr = ['current', 'right', 'top', 'left'];
            for (let i in arr) {
                let desk = cc.find('Canvas/cards/deskCards/' + arr[i]);
                if (desk.children.length > 0) desk.children[desk.childrenCount - 1].active = true;
            }
        }, 800)

        var gamePlay = cc.weijifen.gamePlay;
        if (cc.sys.localStorage.getItem('cb') == 'true' && cc.sys.localStorage.getItem('altings') != 'true') {
            setTimeout(function () { gamePlay.dealcards(data, context) }, 2100);
        } else {
            gamePlay.dealcards(data, context);
        }
    },
    dealcards: function (data, context) {
        cc.sys.localStorage.removeItem('cb');
        var gamePlay = cc.weijifen.gamePlay;
        var gameStartInit = cc.weijifen.gameStartInit;
        var gameStartInitNode = cc.find('Canvas').getComponent('GameStartInit');
        context.closeloadding();
        let player = gameStartInit.player(data.userid, context);
        if (player) context.changeLight(player.tablepos, context);
        context.changeStatu("nextplayer", context);
        //摸牌补花
        //补花值为bet数组时
        if (data.bu) {
            // var buhua = context.decode(data.bu);//补花
            var buhua = data.bu;//补花
            for (var i = 0; i < buhua.length; i++) {
                gameStartInit.buhuaModle(buhua[i], player.tablepos);
            }
        }

        if (data.userid == cc.weijifen.user.id) {
            if (cc.sys.localStorage.getItem('altings') != 'true') {
                gameStartInit.tingnoaction();
            }
            if (cc.sys.localStorage.getItem('altake') != 'true') {
                cc.sys.localStorage.setItem('take', 'true');
            } else {
                cc.sys.localStorage.removeItem('altake');
            }
            gamePlay.initDealHandCards(context, data);
        } else {
            if (player) {
                gameStartInit.initPlayerHandCards(player.tablepos, context, 1);
            }
        }
        gameStartInitNode._cardsCount.string = data.deskcards;
        if (data.power) {
            // 摸宝牌
            var par = cc.find('Canvas/cards/otherCards/cardTip/baoCard');//宝牌父节点
            // var laiziFM = cc.instantiate(gameStartInitNode.deskcard_one);---------------
            // if (data.powerCard && data.powerCard.length > 0) {
            //     cc.weijifen.baopai = data.powerCard;
            // }
            // laiziFM.parent = par;
            // if (par.children.length > 1) {
            //     if (cc.weijifen.GameBase.gameModel == 'wz') return;
            //     par.children[1].destroy();
            // }
        }
    },
    initDealHandCards: function (context, data) {
        var gameStartInit = cc.find('Canvas').getComponent('GameStartInit');
        gameStartInit.initcardwidth();
        let temp;
        if (context.cardpool.size() > 0) {
            temp = context.cardpool.get();
        } else {
            temp = cc.instantiate(context.handcardPrefab);
        }
        if (temp) {
            let temp_script = temp.getComponent("HandCard");
            context.playercards.push(temp);
            temp_script.init(data.card);
            temp_script.lastone();
            temp.zIndex = 2000; //直接放到最后了，出牌后，恢复 zIndex
            temp.opacity = 0;
            temp.y += 80;
            temp.parent = cc.find('Canvas/cards/handCards/current/handCards');  //庄家的最后一张牌
            temp_script.showAction();//渐现
        }
    },
    // update (dt) {},
});
