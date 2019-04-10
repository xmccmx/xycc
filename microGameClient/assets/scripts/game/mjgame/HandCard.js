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
        atlas: cc.SpriteAtlas,//手牌图集
        cardvalue: cc.Node,//牌面
        csImageTop: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.lastonecard = false;
        this.take = false;
        if (cc.sys.localStorage.getItem("replayData") == null) {
            this.node.on('touchmove', this.mouseMove, this);
            this.node.on('touchend', this.mouseUp, this);
        } else {
            this.node.getComponent(cc.Button).interactable = false;
        }
    },
    mouseUp: function (event) {
        //获取当前节点在canvas对应的坐标位置
        var newVec2 = event.target.convertToNodeSpaceAR(cc.v2(667, 375));
        cc.weijifen.cardPostion = {
            x: -newVec2.x,
            y: -newVec2.y
        }
        if (cc.sys.localStorage.getItem('delta') > 90) {
            event.target.x = 0;
            event.target.y = 0;
            this.node.dispatchEvent(new cc.Event.EventCustom('takecard', true));
        }
        event.target.x = 0;
        event.target.y = 0;
        cc.sys.localStorage.removeItem('delta');
    },
    mouseMove: function (event) {
        var delta = event.touch.getDelta();
        event.target.x += delta.x;
        event.target.y += delta.y;
        cc.sys.localStorage.setItem('delta', event.target.y);
        if (cc.find('Canvas/other/tingSelectBg')) {
            cc.find('Canvas/other/tingSelectBg').active = false;
        }
    },

    /*
    * 点击出牌
    * @param event 事件对象
    */
    onClick: function (event) {
        cc.weijifen.audio.setSFXVolume(cc.weijifen.mp3Music);
        let context = cc.find('Canvas').getComponent('MJDataBind');
        let self = this;
        // null  && 
        if (cc.weijifen.click == 1 && cc.sys.localStorage.getItem('alting') != 'true') {
            this.huifu(context);
            this.node.dispatchEvent(new cc.Event.EventCustom('takecard', true));
        } else {
            let tingnode = cc.find('Canvas/other/tingSelectBg');
            // 出牌
            if (self.take == true) {
                if (context.tings && cc.sys.localStorage.getItem('ting') == 'true') {
                    tingnode.active = false;
                    for (let i = 0; i < tingnode.childrenCount; i++) {
                        tingnode.children[i].destroy();
                    }
                }
                event.target.x = 0;
                event.target.y = 0;
                this.huifu(context);
                this.node.dispatchEvent(new cc.Event.EventCustom('takecard', true));
            } else {
                // 点击出的牌，y值变高突出于手牌
                this.huifu(context);
                if (cc.sys.localStorage.getItem('alting') == 'true') {
                    cc.sys.localStorage.setItem('take', 'true');
                }
                if (cc.sys.localStorage.getItem("replayData") == null) {
                    self.node.y = self.node.y + 20;
                    self.cardvalue.color = new cc.Color(230, 190, 190);
                }
                self.take = true;
                if (context.tings && cc.sys.localStorage.getItem('ting') == 'true') {
                    for (let i = 0; i < tingnode.childrenCount; i++) {
                        tingnode.children[i].destroy();
                    }
                    for (let j = 0; j < context.tings.length; j++) {
                        let cv = context.tings[j].card;
                        if ((cv < 0 && parseInt(cv / 4) == parseInt(self.value / 4)) || (cv >= 0 && self.mjtype == parseInt(cv / 36) && parseInt((self.value % 36) / 4) == parseInt((cv % 36) / 4))) {
                            let tingcards = context.tings[j].cards;
                            tingnode.active = true;
                            for (let s = 0; s < tingcards.length; s++) {
                                let limian = cc.instantiate(context.handcardPrefab);
                                let cccc = limian.getComponent('HandCard');
                                cccc.init(tingcards[s], true);
                                limian.parent = tingnode;
                            }
                            break;
                        }
                    }
                }
            }
        }
    },
    huifu: function (context) {
        let nodes = context._handCardNode['current'];
        for (let i = 0; i < nodes.childrenCount; i++) {
            let handCards = nodes.children[i].getComponent("HandCard");
            handCards.take = false;
            if (cc.weijifen.cardNum > 14) {
                handCards.node.width = 67.5;
                handCards.node.height = 102.5;
            }
            handCards.node.y = 0;
            if (nodes.children[i].getComponent(cc.Button).interactable && !handCards.caishen) {
                handCards.cardvalue.color = new cc.Color(255, 255, 255);
            }
        }
    },
    /*
   * @param cvalue 手牌所代表的数字
   * @param pd
   */
    init: function (cvalue, pd) {
        if (this.node.children[1]) this.node.children[1].active = false;
        this.cardcolor();
        this.caishen = false;
        this.take = false;//是否已被点击突出显示
        this.value = cvalue;
        let cardcolors = parseInt(this.value / 4);
        let cardtype = parseInt(cardcolors / 9);

        this.mjtype = cardtype;
        this.mjvalue = parseInt((this.value % 36) / 4);
        this.lastonecard = false;//最后一张手牌标记
        let csType1, csType2;
        let csCardColors1, csCardColors2;
        let csValue1, csValue2;
        if (cc.weijifen.powerCard) {
            csCardColors1 = parseInt(cc.weijifen.powerCard[0] / 4);
            csType1 = parseInt(csCardColors1 / 9);//第一张财神牌类型 
            csValue1 = (parseInt((cc.weijifen.powerCard[0] % 36) / 4) + 1);
            if (cc.weijifen.powerCard.length == 2) {
                csCardColors2 = parseInt(cc.weijifen.powerCard[1] / 4);
                csType2 = parseInt(csCardColors2 / 9);//第二张财神牌类型
                csValue2 = (parseInt((cc.weijifen.powerCard[1] % 36) / 4) + 1);
            }
        }
        let deskcard;
        if (cardcolors < 0) {
            var array = ['M_wind_east', 'M_wind_south', 'M_wind_west', 'M_wind_north', 'M_red', 'M_green', 'M_white'];
            if (array[cardcolors + 7]) {
                deskcard = array[cardcolors + 7];
            }
            //东南西北风 ， 中发白
            if (cardcolors == csCardColors1 || (csCardColors2 != null && cardcolors == csCardColors2) || (this.value >= -39 && this.value <= -36)) {
                this.caishenCards();
            }
        } else {
            if (cardtype == 0) { //万
                deskcard = "M_character_" + (parseInt((this.value % 36) / 4) + 1);
            } else if (cardtype == 1) { //筒
                deskcard = "M_dot_" + (parseInt((this.value % 36) / 4) + 1);
            } else if (cardtype == 2) {  //条
                deskcard = "M_bamboo_" + (parseInt((this.value % 36) / 4) + 1);
            }
            if (cardtype == csType1 && (parseInt((this.value % 36) / 4) + 1) == csValue1) {
                this.caishenCards();
            } else if (cardtype == csType2 && (parseInt((this.value % 36) / 4) + 1) == csValue2) {
                this.caishenCards();
            }
        }
        if (deskcard == null) {
            var arr = ['M_winter', 'M_autumn', 'M_summer', 'M_spring', 'M_bamboo', 'M_chrysanthemum', 'M_orchid', 'M_plum'];
            deskcard = arr[cvalue + 39];
        }
        let cardframe = this.atlas.getSpriteFrame(deskcard);
        this.cardvalue.getComponent(cc.Sprite).spriteFrame = cardframe;
        this.cardvalue.width = 88;
        this.cardvalue.height = 140;
        this.node.width = 88;
        this.node.height = 130;
        if (cc.weijifen.cardNum > 14 && !pd) {
            this.cardvalue.width = 65;
            this.cardvalue.height = 100;
            this.node.width = 63;
        } else if (!pd) {
            this.node.width = 93;
        }
        if (cc.sys.localStorage.getItem('alting') == 'true' && pd != true) {
            this.node.getComponent(cc.Button).interactable = false;
        } else if (pd != true) {
            this.node.getComponent(cc.Button).interactable = true;
        }
    },
    /*财神牌初始*/
    caishenCards: function () {
        this.node.children[1].active = true;
        this.node.zIndex = -999 + this.value;
        if (cc.weijifen.GameBase.gameModel == 'jx') {
            this.node.getComponent(cc.Button).enabled = true;//杭州麻将---财神可以出
            this.cardvalue.color = new cc.Color(255, 255, 255);
        } else {
            this.node.getComponent(cc.Button).enabled = false;
            this.cardvalue.color = new cc.Color(118, 118, 118);
        }
        this.caishen = true;
    },
    reinit: function () {
        this.relastone();
        this.lastonecard = false;
        this.cardvalue.opacity = 255;
        if (this.take) {
            this.node.y = 0;
            this.take = false;
        }
    },
    lastone: function () {
        if (this.lastonecard == false) {
            this.lastonecard = true;
            if (cc.weijifen.cardNum > 14) {
                this.node.width = 80;
            } else {
                this.node.width = 130;
            }
            this.node.y = 0;
            if (cc.sys.localStorage.getItem('alting') == 'true') {
                this.node.getComponent(cc.Button).interactable = false;
            } else {
                this.node.getComponent(cc.Button).interactable = true;
            }
        }
    },
    relastone: function () {
        if (this.lastonecard == true) {
            this.lastonecard = false;
            if (cc.weijifen.cardNum > 14) {
                this.cardvalue.width = 65;
                this.cardvalue.height = 100;
                this.node.width = 63;
            } else {
                this.node.width = 93;
            }
            this.node.y = 0;
        }
    },
    cardcolor: function () {
        if (cc.sys.localStorage.getItem('cardcolor') == 'yellow') {
            this.cardvalue.children[0].active = false;
            this.cardvalue.children[1].active = false;
        } else if (cc.sys.localStorage.getItem('cardcolor') == 'blue') {
            this.cardvalue.children[0].active = true;
            this.cardvalue.children[1].active = false;
        } else if (cc.sys.localStorage.getItem('cardcolor') == 'purple') {
            this.cardvalue.children[0].active = false;
            this.cardvalue.children[1].active = true;
        }
    },
    showAction: function () {//摸牌渐显效果
        var fade = cc.fadeIn(0.3);
        var move = cc.moveTo(0.3, cc.v2(this.node.x, this.node.y - 80));
        this.node.runAction(fade);
        this.node.runAction(move);
    },
    offClick: function () {
        this.node.getComponent(cc.Button).interactable = false;
        this.node.off('touchmove', this.mouseMove, this);
        this.node.off('touchend', this.mouseUp, this);
    },
    setAction: function (action) {
        this.action = action;
    },
    actionSeclectClick: function (event) {//碰刚吃胡选择牌型时的clickevent
        var myAction = this.action;
        if (cc.sys.localStorage.getItem('altake') != true) {
            cc.sys.localStorage.setItem('take', 'true');
        }
        let nodes = cc.find('Canvas/other/actionSelectBg/layout');
        for (let i = 1; i < nodes.childrenCount; i++) {
            nodes.children[i].destroy;
        }
        var oper = new cc.Event.EventCustom('mjSelection', true);
        oper.setUserData(myAction);
        this.node.dispatchEvent(oper);
    },
    // update (dt) {},
});
