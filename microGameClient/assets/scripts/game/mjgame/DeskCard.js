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
        atlas: cc.SpriteAtlas,//这个图集，在不同方向上的deskcard预制体上挂的不一样
        count: cc.Label,//蛋牌头顶的label
        X: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
    },
    /**
         * 桌面牌初始化
         * @param  {[Number]}  cvalue  
         * @param  {[String]}  fangwei {B:current、top;L:left;R:right}
         * @param  {[type]}    bol    
         */
    init: function (cvalue, fangwei, bol, direction, replay) {
        this.cardColor();
        var gameModelMp3 = "";//播放声音
        if (Number(this.count.string) == 0 || Number(this.count.string) == 1 || this.count.string == '') {
            this.count.node.active = false;
            this.X.active = false;
        }
        if (cc.weijifen.GameBase.gameModel == "wz") {
            gameModelMp3 = "wz";
            cc.weijifen.genders[direction] = '';
        }
        this.value = cvalue;
        this.fangwei = fangwei;
        let cardframe, K;
        if (fangwei == 'current' || fangwei == 'top') {
            K = 'B';
        } else if (fangwei == 'right') {
            K = 'R';
        } else if (fangwei == 'left') {
            K = 'L';
        } else {
            K = fangwei;
        }
        let cardcolors = parseInt(this.value / 4);
        let cardtype = parseInt(cardcolors / 9);

        this.cardcolor = cardcolors;//主要用于判断风、中发白等
        this.cardtype = cardtype;//牌的类型，当cardcolors>0时 万-0  筒-1  条-2
        this.cardface = parseInt((cvalue % 36) / 4);//牌面

        let types;
        let sprites = this.node.children[0].getComponent(cc.Sprite);
        if (this.back == true) {
            var name = '';
            if (this.fangwei == 'left') {//这几个name在altas中和以前不同，需要修改
                name = 'e_mj_b_left';
            } else if (this.fangwei == 'top') {
                name = 'e_mj_b_bottom';
                this.node.height = 63;
            } else if (fangwei == 'right') {
                name = 'e_mj_b_right';
            } else {
                name = 'e_mj_b_up';
                this.node.height = 90;
            }
            sprites.spriteFrame = this.atlas.getSpriteFrame(name);
            return;
        }
        if (fangwei != 'Z') {
            if (cardcolors < 0) {
                var array = ['_wind_east', '_wind_south', '_wind_west', '_wind_north', '_red', '_green', '_white'];
                if (array[cardcolors + 7]) {
                    this.cardName = K + array[cardcolors + 7];
                }
                if (!bol) {
                    let time = 0;
                    if (cc.sys.localStorage.getItem('ting') == 'true') {
                        time = 1000;
                    }
                    setTimeout(function () {
                        if (direction != undefined) {
                            if (replay != 'false') {
                                cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + 'wind_' + (cardcolors + 8) + cc.weijifen.genders[direction]);
                            }
                        }
                    }, time);
                }
                //东南西北风 ， 中发白
            } else {
                if (cardtype == 0) { //万
                    this.cardName = K + "_character_" + (parseInt((this.value % 36) / 4) + 1);
                    types = 'wan_';
                } else if (cardtype == 1) { //筒
                    this.cardName = K + "_dot_" + (parseInt((this.value % 36) / 4) + 1);
                    types = 'tong_';
                } else if (cardtype == 2) {  //条
                    this.cardName = K + "_bamboo_" + (parseInt((this.value % 36) / 4) + 1);
                    types = 'suo_';
                }
                if (bol != true && direction != undefined) {
                    if (replay != 'false') {
                        cc.weijifen.audio.playSFX('nv/' + gameModelMp3 + types + (parseInt((this.value % 36) / 4) + 1) + cc.weijifen.genders[direction]);
                    }
                }
            }
            var buhuaTrue = false;
            if (this.cardName == null) {//-------------------
                var buhua = "-32,-33,-34,-35,-36,-37,-38,-39";
                if (buhua.indexOf(cvalue) >= 0) {
                    buhuaTrue = true;
                    if (cvalue == -38) {
                        this.cardName = 'B_autumn';//秋
                        cardframe = this.weijifen0.getSpriteFrame(this.cardName);
                        sprites.spriteFrame = cardframe;
                    } else if (cvalue == -35) {
                        this.cardName = this.b_zhu;//竹
                        sprites.spriteFrame = this.cardName;
                    } else if (cvalue == -34) {
                        this.cardName = this.b_ju;//菊
                        sprites.spriteFrame = this.cardName;
                    } else if (cvalue == -33) {
                        this.cardName = this.b_lan;//兰
                        sprites.spriteFrame = this.cardName;
                    } else if (cvalue == -32) {
                        this.cardName = 'B_plum';//梅
                        cardframe = this.weijifen0.getSpriteFrame(this.cardName);
                        sprites.spriteFrame = cardframe;
                    } else if (cvalue == -36) {
                        this.cardName = this.b_chun;//春
                        sprites.spriteFrame = this.cardName;
                    } else if (cvalue == -37) {
                        this.cardName = this.b_xia;//夏
                        sprites.spriteFrame = this.cardName;
                    } else if (cvalue == -39) {
                        this.cardName = 'B_winter';//冬
                        cardframe = this.weijifen0.getSpriteFrame(this.cardName);
                        sprites.spriteFrame = cardframe;
                    }
                }
            }
            // 桌面麻将desk_card中spriteFrame更换
            if (!buhuaTrue) {
                cardframe = this.atlas.getSpriteFrame(this.cardName);
                sprites.spriteFrame = cardframe;
            }
        }
    },
    kongCardInit: function (action) {//原kongcard脚本中的标记函数
        this.action = action;
        this.length = this.node.parent.childrenCount;
        this.type = null;
        for (let i = 0; i < this.length; i++) {
            var card = this.node.parent.children[i].getComponent('DeskCard');
            if (card.cardcolor >= -7 && card.cardcolor <= -4) {
                this.type = 'wind';
                break;
            } else if (card.cardcolor <= -1 && card.cardcolor >= -3) {
                this.type = 'xi';
                break;
            } else if (card.cardface == 8) {
                this.type = 'jiu';
                break;
            } else if ((card.cardtype == 0 || card.cardtype == 1) && card.cardface == 0) {
                this.type = 'yao'
                break;
            }
        }
    },
    cardColor: function () {
        let cardClolors = this.node.children[0];
        if (cc.sys.localStorage.getItem('cardcolor') == 'yellow') {
            cardClolors.children[0].active = false;
            cardClolors.children[1].active = false;
        } else if (cc.sys.localStorage.getItem('cardcolor') == 'blue') {
            cardClolors.children[0].active = true;
            cardClolors.children[1].active = false;
        } else if (cc.sys.localStorage.getItem('cardcolor') == 'purple') {
            cardClolors.children[0].active = false;
            cardClolors.children[1].active = true;
        }
    },
    /**
     * 牌面上的箭头指示
     * @param   cards 桌面牌容器（desk_cards节点下的current、这类节点left）
     */
    initjiantou: function (cards) {
        if (cards.children) {
            for (let i = 0; i < cards.children.length; i++) {
                var card = cards.children[i].getComponent('DeskCards');
                card.jiantou2.destroy();
            }
        }
    },
    setValue: function (values) {
        this.value = values;
    },
    xiaochu: function () {
        let context = cc.find('Canvas').getComponent('MJDataBind');
        this.initjiantou(context.deskcards_current_panel);
        this.initjiantou(context.deskcards_right_panel);
        this.initjiantou(context.deskcards_top_panel);
        this.initjiantou(context.deskcards_left_panel);
    },
    countactive: function (bol) {//bol  是区别结算界面和游戏中的bool
        if (this.fangwei == 'top') {
            this.count.node.x = 8;
            this.count.node.y = -44;
            this.X.x = -7;
            this.X.y = -43;
        } else if (this.fangwei == 'current'||bol) {
            this.count.node.x = 9;
            this.count.node.y = 45;
            this.X.x = -6;
            this.X.y = 46;
        }
        this.count.node.active = true;
        this.X.active = true;
    },
    // update (dt) {},
});
