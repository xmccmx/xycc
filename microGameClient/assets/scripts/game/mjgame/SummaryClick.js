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
        baocardNode: cc.Node,
        base: cc.Node,
        miao: cc.Label,
        continueBtn: cc.Node,
        backhallBtn: cc.Node,
        liuju: cc.Node,
        lose: cc.Node,
        win: cc.Node,
        gameend: cc.Node,
        shareBtn: cc.Node,
        layout2Sprite: cc.SpriteFrame,///信息结算背景
        endlist: cc.Prefab,//总结算panel中每个玩家的结算信息panel    gameend
        list: cc.Prefab,//单局结算每个玩家的结算信息panel   gameend2
        layout2: cc.Node,//大局结算panel的父节点
        //以上字段位于summary->也就是结算panel预制体中   endlist  list

        //以下位于gameend   总结算单个玩家结算信息panel
        prizeBox: cc.Prefab,//总结算界面中 为比赛情况下使用的比赛结算结算panel   挂载于gameend中

        //一下位于gameend2  单局结算丹姐玩家结算信息panel
        hu: cc.Label,//胡
        jifan: cc.Label,//记番
        mjkong: cc.Node,//actioncard

    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },
    /*
       * 一圈游戏结束，点击继续按钮回到游戏中 单局结算panel
       */
    init: function (data) {
        let self = this;
        this.offNode();
        this.continueBtn.active = true;
        this.shareBtn.active = true;
        var spr = this.base.getComponent(cc.Sprite);
        spr.spriteFrame = this.layout2Sprite;
        if (cc.weijifen.match == 'true' || typeof cc.weijifen.match == 'function') {
            this.t = setInterval(function () { self.daojishi(); }, 1000);
        } else {
            this.miao.node.active = false;
        }
        this.baocardNode.active = true;
        let obj = cc.find('Canvas').getComponent('GameStartInit');
        let card, baopai;
        if (cc.weijifen.GameBase.gameModel == 'wz') {
            this.baocardNode.children[3].getComponent(cc.Label).string = "";
            this.baocardNode.children[1].y += 65;
            this.baocardNode.children[2].y += 65;
            if (cc.weijifen.baopai) {
                for (var i = 0; i < cc.weijifen.baopai.length; i++) {
                    card = cc.instantiate(obj.deskcard_one);
                    baopai = card.getComponent('DeskCard');
                    if (cc.weijifen.powerCard != null) {
                        baopai.node.children[1].active = true;
                    }
                    baopai.init(cc.weijifen.baopai[i], 'B', true);
                    card.parent = this.baocardNode.getChildByName('card');
                }
            } else {
                card = cc.instantiate(obj.deskcard_one);
                baopai = card.getComponent('DeskCard');
                card.parent = this.baocardNode.getChildByName('card');
            }
        }
        let cardnum = this.baocardNode.getChildByName('num').getComponent(cc.Label);
        cardnum.string = cc.find('Canvas').getComponent('MJDataBind').gddesk_cards;
        if (data.playOvers) {
            for (let i = 0; i < data.playOvers.length; i++) {
                var list = cc.instantiate(this.list);
                list.getComponent('SummaryClick').initGameend2(data.playOvers[i]);
                list.parent = this.base.getChildByName('xiaoju');
                if (data.playOvers[i].user == cc.weijifen.user.id) {
                    if (data.playOvers[i].win == true) {
                        this.win.active = true;
                        this.lose.active = false;
                        this.liuju.active = false;
                    } else {
                        this.lose.active = true;
                        this.win.active = false;
                        this.liuju.active = false;
                    }
                }
            }
            if (data.unHu == true) {
                this.liuju.active = true;
                this.lose.active = false;
                this.win.active = false;
            }
        }
    },
    /*
    * 房间游戏结束，可返回大厅  总结算panel
    */
    init2: function (data) {
        this.offNode();
        this.gameend.active = true;
        this.backhallBtn.active = true;
        var basesprite = this.base.getComponent(cc.Sprite);
        basesprite.spriteFrame = null;
        if (data.players) {
            for (let i = 0; i < data.players.length; i++) {
                var list = cc.instantiate(this.endlist);
                var dayingjia = this.func('pointCount', i, data);
                var paoshou = this.func('dianCount', i, data);
                list.getComponent('SummaryClick').init3(data.players[i], dayingjia, paoshou);
                list.parent = this.layout2;
            }
        }
    },
    func: function (counts, inx, data) {
        let zhen = true;
        let count = data.players[inx][counts];
        for (let i = 0; i < data.players.length; i++) {
            if (count == 0 || (i != inx && data.players[i][counts] > count)) {
                zhen = false;
                break;
            }
        }
        return zhen;
    },
    offNode: function () {
        this.continueBtn.active = false;
        this.backhallBtn.active = false;
        this.gameend.active = false;
        if (cc.sys.localStorage.getItem("replayData") != null) {
            this.shareBtn.active = false;
        }
    },
    daojishi: function () {
        this.times--;
        if (this.miao) {
            this.miao.string = this.times;
            if (cc.find('Canvas/big_cards').children) {
                cc.find('Canvas/big_cards').removeAllChildren();
            }
            if (this.times < 0) {
                clearInterval(this.t);
                if (cc.weijifen.matchOver) {
                    cc.weijifen.matchOver = null;
                    this.miao.string = '';
                    return
                }
                cc.find('Canvas/summary').destroy();
            }
        }
    },


    //以下主要用于比赛结算panel

    /**
    * 总结算panel,比赛结算panel    挂prizeBox预制体
    */
    init3: function (data, dayingjia, dianpao) {
        let headimg;
        let detail = this.node.getChildByName('detail');
        let hucount = detail.getChildByName('hupai').children[1].getComponent(cc.Label);
        let dianpaocount = detail.getChildByName('dianpao').children[1].getComponent(cc.Label);
        let mobaocount = detail.getChildByName('mobao').children[1].getComponent(cc.Label);
        let zhuangcount = detail.getChildByName('zhuang').children[1].getComponent(cc.Label);
        hucount.string = data.huCount;
        dianpaocount.string = data.dianCount;
        mobaocount.string = data.touchBao;
        if (cc.weijifen.GameBase.gameModel == 'nj') {
            mobaocount.node._parent.active = false;
        }
        zhuangcount.string = data.bankerCount;
        this.node.getChildByName('total').getComponent(cc.Label).string = '总分：' + data.pointCount;
        let context = cc.find('Canvas').getComponent('MJDataBind');
        let player = cc.weijifen.gameStartInit.player(cc.weijifen.user.id, context);
        headimg = player.data.headimgurl;
        let name = this.node.getChildByName('name').getComponent(cc.Label);
        player.data.username.length > 8 ? name.string = player.data.username.slice(0, 6) + '...'
            : name.string = player.data.username;
        //这个值代表大赢家
        if (dayingjia) {
            this.node.getChildByName('dyj').active = true;
        }
        //大赢家和点炮不能同时出现  这个是点炮高手
        if (dianpao && !dayingjia) {
            this.node.getChildByName('paoshou').active = true;
        }
        //头像
        if (headimg) {
            var imgurl = headimg;
            var head = this.node.getChildByName('img');
            var sprite = head.getComponent(cc.Sprite);
            cc.loader.load({ url: imgurl, type: 'jpg' }, function (suc, texture) {
                sprite.spriteFrame = new cc.SpriteFrame(texture);
                head.width = 90;
                head.height = 90;
            });
        }
        let self = this;
        // 比赛结束后弹出提示 比赛结束弹出中奖信息
        if (cc.weijifen.match == "true") {
            /* 例子数据：
            * {
                    "name": "Guest_0ZVI5N",
                    "activityName": "房卡赛",
                    "activityTime": "2018-07-05 19:08:00 到 2018-07-05 19:08:40",
                    "prizeName": "谢谢参与", // 比赛奖励(如果值为‘谢谢参与’则没有中奖，领取奖品按钮不会显示)
                    "url": "http://game.bizpartner.cn/registerPlayer/getEWMImage?token=2022e1ec72434c05b840f17c8ba2eb67",
                    "position": "7"
                }*/
            cc.sys.localStorage.removeItem('signUp');
            if (cc.sys.localStorage.getItem('matchOver') && cc.sys.localStorage.getItem('matchPrize')) {
                cc.weijifen.endMatchFlag++;
                if (cc.weijifen.endMatchFlag > 1) return;
                let data = JSON.parse(cc.sys.localStorage.getItem('matchPrize'));
                let box = cc.instantiate(self.prizeBox);
                let timer1 = setTimeout(function () {
                    let msgbox = box.getChildByName('base').getChildByName('msg_box');
                    msgbox.getChildByName('match_name').children[1].getComponent(cc.Label).string = data.activityName||'';
                    let time = data.activityTime;
                    msgbox.getChildByName('match_time').getComponent(cc.Label).string = '(' + time.toString().substring(0, 10) + '场)';
                    if (data.position != null) {//移除了  有需要再加
                        msgbox.getChildByName('position').children[1].getComponent(cc.Label).string = data.position||'';
                    }
                    msgbox.getChildByName('palyer_name').getComponent(cc.Label).string = '恭喜' + data.name + '在';
                    if (data.prizeName) {
                        msgbox.getChildByName('prize').active = true;
                        msgbox.getChildByName('prize').children[0].getComponent(cc.Label).string = data.prizeName||'';
                    } else {
                        let num = msgbox.getChildByName('match_time').children[0];
                        num.active = true;
                        num.getComponent(cc.Label).string = '第' + data.position + '名';
                    }
                    if (data.prizeName == '谢谢参与') {
                        box.getChildByName('base').getChildByName('getprizeBtn').active = false;
                    }
                    // 二维码
                    /*let img = box.getChildByName('base').getChildByName('msg_box').getChildByName('erweima');
                    if(data.url){
                        var imgurl = data.url;
                        // 测试数据
                        // var imgurl = 'http://game.bizpartner.cn/registerPlayer/getEWMImage?token=5399d111b3f940c8843dd75fd6c27690';
                        var sprite = img.getComponent(cc.Sprite);
                        cc.loader.load({url:imgurl,type:'jpg'},function(suc,texture){
                            sprite.spriteFrame = new cc.SpriteFrame(texture);
                            img.width = 294;
                            img.height = 266;
                        });
                    }*/
                    box.parent = cc.find('Canvas');
                    box.zIndex = 28000;
                    clearTimeout(timer1);
                }, 1000);
            } else {
                let timer = setTimeout(function () {
                    cc.sys.localStorage.removeItem('matchTime');
                    var msg = '比赛结束后，系统会对数据进行统计，获奖玩家可在【通知】中查看中奖信息';
                    cc.weijifen.alert(msg);
                    clearTimeout(timer);
                }, 1000);
            }

        } else {
            cc.sys.localStorage.removeItem('matchType');
        }
    },
    /**
        * 小局结束，gameend2的init
        */
    initGameend2: function (data) {
        let gang = 0;
        let fan = 0;
        let units;
        let drop = '';
        let noTing = '';
        let tai = '';
        this.hu.string = '';
        let context = cc.find('Canvas').getComponent('MJDataBind');
        let obj = cc.find('Canvas').getComponent('GameStartInit');
        if (cc.weijifen.GameBase.gameModel == 'nj') {
            let baoBox = cc.find('Canvas/summary').children[8];
            baoBox.active = false;
        }
        if (data.point) {//更新所有玩家的得分
            let players = context.playersarray;
            for (let i = 0; i < players.length; i++) {
                let player = players[i].getComponent('MJPlayer');
                if (data.user == player.data.id) {
                    player.scoreLabel.string = data.point;
                }
            }
        }
        if (data.gang) {
            gang = data.gang.count;
        }
        if (data.balance) {
            let summary = cc.find('Canvas/summary').getComponent('SummaryClick');
            // 补花
            // huaCards = [-32,-33,-34,-35,-36,-37,-38,-39,-6,-9,-12];
            if (data.balance.buhua) {//-----------
                let huaCards = data.balance.buhua;
                for (let i = 0; i < huaCards.length; i++) {
                    let card = cc.instantiate(this.buhua);
                    card.getComponent('BuHuaAction').init(huaCards[i]);
                    card.parent = this.huaParent;//补花
                }
            }
            if (data.balance.bao != -1) {
                var card = cc.instantiate(obj.deskcard_one);
                var src = card.getComponent('DeskCard');
                src.init(data.balance.bao, 'B', true);
                card.width = 111;
                card.height = 166;
                card.children[0].width = 111;
                card.children[0].height = 166;
                card.parent = summary.baocardNode.children[0];//宝牌
            }
            if (data.balance.drop == true) {
                drop = '点炮';
            }
            if (data.balance.taishu) {
                tai = ' ' + data.balance.taishu + '台';
            }
            units = data.balance.units;
            fan = data.balance.count;

            if (units) {
                let point = '';
                for (let i = 0; i < units.length; i++) {
                    if (cc.weijifen.GameBase.gameModel == 'wz') {
                        point = units[i].point;
                    }
                    this.hu.string += (units[i].tip + ' ' + point + ' ');
                }
            }
            if (cc.weijifen.GameBase.gameModel == 'ch') {
                this.jifan.string = fan + '番' + ' ' + gang + '杠   ';
                if (data.balance.noTing == true) {
                    noTing = '未上听';
                } else {
                    noTing = '上听';
                }
            }
        }
        this.hu.string += noTing + '  ' + drop + ' ' + tai;
        var cardsss = data.cards;
        function sortNumber(a, b) { return a - b }
        cardsss.sort(sortNumber);
        if (data.user == cc.weijifen.banker) {//庄家
            this.node.getChildByName('zhuang').active = true;
        }
        let headimgs = this.node.getChildByName('img');
        var player = obj.player(cc.weijifen.user.id, context);
        headimgs.getChildByName('name').getComponent(cc.Label).string = player.data.username||'';//name
        if (data.headimgurl) {//头像和框
            var imgurl = data.headimgurl;
            var sprite = headimgs.getComponent(cc.Sprite);
            var head = headimgs;
            cc.loader.load({ url: imgurl, type: 'jpg' }, function (suc, texture) {
                sprite.spriteFrame = new cc.SpriteFrame(texture);
                head.width = 65;
                head.height = 65;
            });
            var headBorder = headimgs.getChildByName('kuang').getComponent(cc.Sprite);
            headBorder.width = 70;
            headBorder.height = 65;
            if (cc.weijifen.level == 2) {
                headBorder.spriteFrame = player.headBorder.getSpriteFrame('333333333');
            } else if (cc.weijifen.level == 1) {
                headBorder.spriteFrame = player.headBorder.getSpriteFrame('111111111');
            } if (cc.weijifen.level == 0) {
                headBorder.spriteFrame = player.headBorder.getSpriteFrame('222222');
            }
        }
        headimgs.getChildByName('count').getComponent(cc.Label).string = data.count||'';
        if (data.win == true) {
            //单局获胜logo
        }
        function setCardSize(node) {
            node[0].parent.width -= 6;
            node[0].width = 80;
            node[0].height = 115;
            node[0].x = 0;
            node[0].y = 5;
            node[1].width = 80;
            node[1].height = 115;
            node[1].x = 0;
            node[1].y = 5;
        };
        for (let i = 0; i < data.actions.length; i++) {
            let kong = cc.instantiate(this.mjkong);
            let action = data.actions[i].card;
            function sortNumber(a, b) { return a - b };
            action.sort(sortNumber);
            if (data.actions[i].action == 'gang' && action.length == 1) {//杠
                let c = [action[0], action[0], action[0], action[0]];
                for (let h = 0; h < 4; h++) {
                    let card = cc.instantiate(obj.deskcard_one);
                    let b = card.getComponent('DeskCard');
                    if (data.actions[i].type == 'an' && (h != 2)) {//暗杠
                        b.back = true;
                    }
                    b.init(c[h], 'B', true);//单局结算panel中杠牌初始化
                    setCardSize(card.children);
                    card.parent = kong;
                }
                if (kong.children.length) {
                    kong.parent = this.mjkong.parent;
                } else {
                    kong.destroy();
                }
            } else if (data.actions[i].action == 'dan') {
                if (action.length == 1) {//action.card中只有一张牌的时
                    var bools = false;//判断这一张牌是否已经做过string+1,true则不再显示在结算界面上
                    var arr = this.mjkong.parent;
                    for (let u = 1; u < arr.childrenCount; u++) {//遍历所有的蛋、吃、碰杠的显示节点
                        for (let p = 0; p < arr.children[u].childrenCount; p++) {//遍历对应action的所有牌
                            var mjcard = arr.children[u].children[p];
                            var src = mjcard.getComponent('DeskCard');
                            src.count.node.scale = 0.8;
                            src.X.scale = 0.8;
                            var valueA, valueB;
                            if (src.value >= 0) {//拿到card对应的int值
                                valueA = parseInt(src.value / 4);
                            } else {
                                valueA = 26 - parseInt(src.value / 4);
                            }
                            if (action[0] >= 0) {
                                valueB = parseInt(action[0] / 4);
                            } else {
                                valueB = 26 - parseInt(action[0] / 4);
                            }
                            if (valueA == valueB) {//action.card的int值在对应action节点的子集中已有，label的string++
                                if (Number(src.count.string) == 0 || Number(src.count.string) == 1 || src.count.string == '') {
                                    src.count.string = 2;

                                } else {
                                    src.count.string = Number(src.count.string) + 1;
                                }
                                src.countactive(true);
                                bools = true;
                                break;
                            }
                        }
                        if (bools) {
                            break;
                        }
                        if (u == arr.childrenCount - 1) {
                            let xiao = cc.instantiate(obj.deskcard_one);
                            let src = xiao.getComponent('DeskCard');
                            src.init(action[0], 'B', true);
                            setCardSize(src.node.children);
                            if (src.count.string != '' && Number(src.count.string) != 1 && Number(src.count.string) != 0) src.countactive(true);
                            xiao.parent = kong;//----------
                        }
                    }

                }
                else { //action.card有多张牌时
                    let nums = true;//此为当初始3张蛋牌中有两张1条时，判断是否为第一张计数count++；
                    for (let q = 0; q < action.length; q++) {
                        var bools = false;//判断这一张牌是否已经做过string+1,true则不再显示在结算界面上
                        var bol = true;
                        for (let u = 0; u < kong.childrenCount; u++) {//action中的card可能有重复的，刚才就是，有7张，所以在这里也加一层判断
                            var mjcard = kong.children[u];
                            var src = mjcard.getComponent('DeskCard');
                            src.count.node.scale = 0.8;
                            src.X.scale = 0.8;
                            var valueA, valueB;
                            if (src.value >= 0) {//一万有为0的。。。要考虑进去
                                valueA = parseInt(src.value / 4);
                            } else {
                                valueA = 26 - parseInt(src.value / 4);
                            }
                            if (action[q] >= 0) {
                                valueB = parseInt(action[q] / 4);
                            } else {
                                valueB = 26 - parseInt(action[q] / 4);
                            }
                            if (valueA == valueB) {//第一次action[q]为1条时，kong中没有1条则渲染一个，第二次有了，但是还是需要渲染一个，第三次不让渲染只允许计数一次
                                if (valueB == 18 && nums) {//蛋中最多出现两张1条，所以当两张蛋牌渲染上限，就不在渲染1条，直接计数一次，
                                    nums = false;
                                    break;
                                }
                                if (Number(src.count.string) == 0 || Number(src.count.string) == 1 || src.count.string == '') {
                                    src.count.string = 2;

                                } else {
                                    src.count.string = Number(src.count.string) + 1;
                                }
                                src.countactive(true);
                                bools = true;
                                break;
                            }
                        }
                        if (bools) {
                            continue;
                        }
                        let xiao = cc.instantiate(obj.deskcard_one);
                        let src = xiao.getComponent('DeskCard');
                        src.init(action[q], 'B', true);
                        setCardSize(src.node.children);
                        if (src.count.string != '' && Number(src.count.string) != 1 && Number(src.count.string) != 0) src.countactive(true);
                        xiao.parent = kong;
                    }
                    if (kong.children.length) {
                        kong.parent = this.mjkong.parent;
                    } else {
                        kong.destroy();
                    }
                }
            } else if (action.length > 0 && data.actions[i].action != 'dan') {
                for (let j = 0; j < action.length; j++) {
                    let card = cc.instantiate(obj.deskcard_one);
                    let c = action[j];
                    let src = card.getComponent('DeskCard');
                    src.init(c, 'B', true);
                    setCardSize(src.node.children);
                    card.parent = kong;
                }
                if (kong.children.length) {
                    kong.parent = this.mjkong.parent;
                } else {
                    kong.destroy();
                }
            }
        }
        {
            let kong = cc.instantiate(this.mjkong);
            for (let i = 0; i < cardsss.length; i++) {//正常的手牌
                let card = cc.instantiate(obj.deskcard_one);
                let b = card.getComponent('DeskCard');
                b.init(cardsss[i], 'B', true);
                setCardSize(b.node.children);
                card.parent = kong;
                if (kong.children.length) {
                    kong.parent = this.mjkong.parent;
                } else {
                    kong.destroy();
                }
            }
        }
        {
            if (data.win) {//赢的那张牌
                let kong = cc.instantiate(this.mjkong);
                let card = cc.instantiate(obj.deskcard_one);
                let b = card.getComponent('DeskCard');
                b.init(data.balance.huCard, 'B', true);
                setCardSize(b.node.children);
                card.parent = kong;
                if (kong.children.length) {
                    kong.parent = this.mjkong.parent;
                } else {
                    kong.destroy();
                }
            }
        }
    },
    onBGClick: function (event) {//单局结算panel 继续btn点击事件
        if (cc.find('Canvas/showTakeCardPanel').children) {
            cc.find('Canvas/showTakeCardPanel').removeAllChildren();
        }
        this.node.dispatchEvent(new cc.Event.EventCustom('readyGM', true));
        this.node.dispatchEvent(new cc.Event.EventCustom('restar', true));
    },
    //分享结算图片image
    shareImage: function (event) {
        var object = cc.find('Canvas').getComponent('MJDataBind');
        // 创建 renderTexture
        var renderTexture = cc.RenderTexture.create(1280, 720);
        //实际截屏的代码
        renderTexture.begin();
        //this.richText.node 是我们要截图的节点，如果要截整个屏幕，可以把 this.richText 换成 Canvas 切点即可
        var canvas = cc.find("Canvas").getComponent(cc.Canvas);
        canvas.node._sgNode.visit();
        renderTexture.end();

        // 获取SpriteFrame
        var nowFrame = renderTexture.getSprite().getSpriteFrame();

        // 赋值给需要截图的精灵
        this.show.spriteFrame = nowFrame;

        // 翻转得到的纹理
        var action = cc.flipY(true);
        this.show.node.runAction(action);
        // 保存截图到本地

        renderTexture.saveToFile("demo.png", cc.ImageFormat.PNG, true, function (event) {

            let windowSize = cc.view.getVisibleSize();
            cc.log("width=" + windowSize.width + ",height=" + windowSize.height);
            //打印本地的地址   
            cc.log("iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii:" + jsb.fileUtils.getWritablePath())
            var jsonData = {
                title: "心缘竞技",
                imgUrl: jsb.fileUtils.getWritablePath() + "demo.png",
                width: windowSize.width,
                height: windowSize.height,
                conType: 2,
                msgType: 1
            }
            // var res = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", "shareEvent",JSON.stringify(jsonData));
            var res = jsb.reflection.callStaticMethod(...object.anMethodParam().shareEvent, JSON.stringify(jsonData));
        });

        return;
    },
    endclick: function (event) {
        var a = {};
        a.key = true;
        var oper = new cc.Event.EventCustom('restar', true);
        oper.setUserData(a);
        this.node.dispatchEvent(oper);
    },
    // update (dt) {},
});
