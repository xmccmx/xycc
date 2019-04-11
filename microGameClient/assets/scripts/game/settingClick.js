// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
var bol = false, df;
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
        setImg1: cc.SpriteFrame,//菜单btn的两个图片
        setImg2: cc.SpriteFrame,
        summary: cc.Prefab,//结算panel

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        cc.find('Canvas/menuBtn/mask').active = false;
    },

    start() {

    },

    // 点击解散房间btn，弹出解散房间alert
    overClick: function () {
        // 房主解散房间
        let context = cc.find('Canvas').getComponent('MJDataBind');
        if (cc.sys.localStorage.getItem('isPlay') != 'true' && cc.weijifen.user.id != context.creatorid) {
            cc.weijifen.wjf.alert('游戏未开始只有房主可以解散房间!', null, 1, function () { cc.weijifen.alert.put(cc.find('Canvas/alert')); }, function () { cc.weijifen.alert.put(cc.find('Canvas/alert')); });
            return
        }
        if (!cc.sys.localStorage.getItem("jiesanTime")) {
            bol = true;
        } else {
            if (cc.sys.localStorage.getItem("jiesanTime")) {
                var timer = setInterval(function () {
                    df++;
                    if (df > 30) {//大于30秒
                        bol = true;
                        cc.sys.localStorage.removeItem("jiesanTime");
                        df = 0;
                        clearInterval(timer);
                    }
                }, 1000);
            } else {
                bol = true;
            }
        }
        if (true) {
            cc.sys.localStorage.setItem("userOverBtn", 1);//解散发起者，取消解散房间请求标记---不用发送请求关闭解散panel即可
            cc.sys.localStorage.setItem("jiesanTime", new Date());
            cc.weijifen.alert.put(cc.find('Canvas/alert'));
            if (cc.weijifen.alert.size() > 0) {
                var item = cc.weijifen.alert.get();
                item.parent = cc.find("Canvas");
                let script = item.getComponent("Alert");
                script.init('是否解散房间？', null, 2, cc.weijifen.alertjs.overGameClick, null);
                script._canshow = true;
                item.zIndex = 30000;
            }
            bol = false;
            context._me = true;
        } else {
            cc.weijifen.wjf.alert('请30秒后再进行操作!', null, 1, null, null);
            let timer = setTimeout(function () {
                bol = true;
                clearTimeout(timer);
            }, 30000)
        }
    },
    //点击菜单btn 下移或上拉列表
    settingBtnClick() {
        let settting_box = cc.find('Canvas/menuBtn/menu');
        let menu_btn = cc.find('Canvas/menuBtn');
        cc.weijifen.settingflag = !cc.weijifen.settingflag;
        setTimeout(() => {
            if (cc.weijifen.settingflag) {
                menu_btn.children[0].active = true;
                settting_box.active = true;
                var action = cc.moveTo(0.2, cc.v2(0, -35));
                settting_box.runAction(action);
                menu_btn.getComponent(cc.Sprite).spriteFrame = this.setImg2;
            } else {
                menu_btn.children[0].active = false;
                var action = cc.moveTo(0.2, cc.v2(0, 357));
                menu_btn.getComponent(cc.Sprite).spriteFrame = this.setImg1;
                settting_box.runAction(action);
            }
        }, 60);
    },
    //一些需要通过点击整个桌面来关闭节点的func
    maskClick: function (evt) {
        evt.target.active = false;
        evt.bubble = false;
    },
    //点击退出房间btn弹出退出房间alert
    leaveClick: function () {
        cc.weijifen.wjf.alert('是否退出房间？', null, 2, cc.weijifen.alertjs.leaveGameClick, null);
    },
    /**
       * 点击解散btn时，弹出解散房间alert
       */
    isOver_event: function (data, context) {
        cc.sys.localStorage.setItem('unOver', 'true');
        if (context._me) {
            context._me = false;
            return;
        }
        if (cc.weijifen.alert.size() > 0) {
            var alert = cc.weijifen.alert.get();
            alert.parent = cc.find("Canvas");
            let script = alert.getComponent('Alert');
            script.init('你的好友请求解散房间!', null, 3, script.overGameClick.bind(script), script.goonGameClick.bind(script));
            script.showPlayerImg(script);
            if (cc.weijifen.GameBase.gameModel == 'ch') {
                if (cc.sys.localStorage.getItem('overClickTime')) {
                    var date2 = new Date();
                    var date1 = new Date(cc.sys.localStorage.getItem('overClickTime'));
                    var tim = date2 - date1;
                } else {
                    // 第一次收到isOver
                    let date = new Date();
                    cc.sys.localStorage.setItem('overClickTime', date);
                }
                if (tim < (script.time * 1000)) {
                    script.time = parseInt((script.time * 1000 - tim) / 1000);
                } else {
                    // 第一次收到isOver
                    let date = new Date();
                    cc.sys.localStorage.setItem('overClickTime', date);
                }
            } else {
                script.time = 30;
            }
            if (Number(cc.sys.localStorage.getItem("isHide")) == 1) {
                clearInterval(mj.t);
            }
            cc.weijifen.t = setInterval(function () { script.daojishi() }, 1000);
        }
    },
    gameOver_event: function (data, context) {
        if (cc.find("Canvas/overCount")) {
            cc.find("Canvas/overCount").parent = null;
        }
        if (cc.find("Canvas/alert")) {
            cc.weijifen.alert.put(cc.find('Canvas/alert'));
        }
        cc.weijifen.matchOver = true;
        cc.weijifen.room = null;
        let self = cc.find('Canvas/bg').getComponent('settingClick');
        let time;
        if (cc.sys.localStorage.getItem('unOver') == 'true') {
            time = 0;
            cc.sys.localStorage.removeItem('unOver');
        } else {
            time = 3000;

        }
        if (!cc.sys.localStorage.getItem('replayData')) {
            setTimeout(function () { self.endGameOver(data) }, time);
        }
        cc.sys.localStorage.removeItem('overClickTime');
        cc.sys.localStorage.removeItem('isPlay');
        cc.sys.localStorage.removeItem('gotWsUrl');
        cc.sys.localStorage.removeItem('zuomangjikai');
        cc.sys.localStorage.removeItem('zuomangjikai2');
    },
    //渲染结算panel
    endGameOver: function (data) {
        let temp = cc.instantiate(this.summary);
        temp.parent = cc.find('Canvas');
        temp.getComponent('SummaryClick').init2(data);
    },
    over_event: function () {
        cc.weijifen.maxRound = null;
        cc.weijifen.op = null;
        cc.weijifen.playerNum = null;
        cc.weijifen.room = null;
        cc.weijifen.cardNum = null;
        cc.sys.localStorage.setItem('dis', 'true');
        cc.director.loadScene('gameMain');
        clearTimeout(cc.weijifen.t);
    },
    unOver_event: function () {
        clearTimeout(cc.weijifen.t);
        if (cc.find('Canvas/alert')) {
            let time = setTimeout(function () {
                cc.weijifen.alert.put(cc.find('Canvas/alert'));
                clearTimeout(time);
            }, 5000);
        }
    },
    // 点击设置btn
    gameSetting: function () {
        // let cardcolor = cc.sys.localStorage.getItem('cardcolor');
        // let j;
        let mjdata = cc.find('Canvas').getComponent('MJDataBind');
        let setting = cc.instantiate(mjdata.setpanelPrefab);
        setting.parent = cc.find('Canvas');
        //设置panel设置card颜色
        // if (setting) {
        //     let cards = cc.find('Canvas/setting/majiang');
        //     for (let i = 0; i < cards.children.length; i++) {
        //         if (cardcolor == 'yellow') { j = 0 } else
        //             if (cardcolor == 'blue') { j = 1 } else
        //                 if (cardcolor == 'purple') { j = 2 };
        //         cards.children[i].getChildByName('select_box').active = false;
        //         cards.children[j].getChildByName('select_box').active = true;
        //     }
        // }
    },
    // update (dt) {},
});
