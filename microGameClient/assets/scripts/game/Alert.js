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
        true: cc.Node,
        false: cc.Node,
        upMsg: cc.Node,
        midMsg: cc.Node,
        list: cc.Node,//解散房间panel中玩家头像列表父节点
        queding: cc.SpriteFrame,
        quxiao: cc.SpriteFrame,
        tongyi: cc.SpriteFrame,
        jujue: cc.SpriteFrame,
        jixu: cc.SpriteFrame,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
    },
    /**
     * 
     * @param {*主信息label} upmsg 
     * @param {*辅助信息label} midmsg 
     * @param {*1--提示框  2--确定取消框 3--同意拒绝框} btn 
     * @param {*同意func，或者确定func} fun1 
     * @param {*拒绝func} fun2 
     */
    init: function (upmsg, midmsg, btn, fun1, fun2) {

        this.list.y = 8;
        for (var i = this.list.childrenCount - 1; i > 0; i--) {
            this.list.children[i].destroy();
        }
        this.true.active = true;
        this.upMsg.active = true;
        this.upMsg.getComponent(cc.Label).string = upmsg;
        if (midmsg != null) {
            this.midMsg.active = true;
            this.midMsg.getComponent(cc.Label).string = midmsg;
        }
        var spriteFalse = this.false.getComponent(cc.Sprite).SpriteFrame;
        var spriteTrue = this.true.getComponent(cc.Sprite).SpriteFrame;
        this._funok = fun1;
        this._funno = fun2;
        if (btn != 1) {
            this.false.active = true;
            this.true.setPosition(-105, -75);
            this.false.setPosition(105, -75);
            if (btn == 2) {//确定、取消弹框
                spriteFalse = this.quxiao;
                spriteTrue = this.queding;
            }
            if (btn == 3) {//同意、拒绝弹框
                spriteFalse = this.jujue;
                spriteTrue = this.tongyi;
            }
        } else {
            this.false.active = false;
            spriteTrue = this.queding;
            this.true.setPosition(0, -75);
        }
    },
    okfunc: function () {
        let self = this;
        if (this._funok != null) {
            this._funok(this);
            this._funok = null;
            this._funno = null;
        } else {
            cc.weijifen.alert.put(self.node);
        }
    },
    nofunc: function () {
        let self = this;
        if (this._funno != null) {
            this._funno();
            this._funok = null;
            this._funno = null;
        } else {
            cc.weijifen.alert.put(self.node);
        }
    },
    //等待解散房间时的倒计时
    daojishi: function () {
        this.time = this.time - 1;
        if (!this.midMsg.active) this.midMsg.active = true;
        if (this.time > -1) {
            this.midMsg.getComponent(cc.Label).string = this.time;
            return
        }
        if (this.time < 0 && cc.director.getScene().name == 'majiang') {
            cc.weijifen.alert.put(cc.find('Canvas/alert'));
            cc.sys.localStorage.removeItem('overGameTime');
            clearInterval(cc.weijifen.t);
        }
    },
    //点击确定解散房间btn
    overGameClick: function (obj) {
        cc.sys.localStorage.setItem('unOver', 'true');
        // let self = cc.find('Canvas/alert').getComponent('Alert');
        // if (self) {
        //     self.daojishi();
        //     self.midMsg.string = '还有' + self.time + '自动解散';
        // }
        obj.true.active = false;
        obj.false.active = false;
        obj.upMsg.getComponent(cc.Label).string = '解散中,请稍后...';
        obj.list.y -= 30;
        if (obj._canshow) {
            obj.showPlayerImg(obj);
        }
        cc.find('Canvas/bg').dispatchEvent(new cc.Event.EventCustom('overGame', true));
        cc.sys.localStorage.removeItem("jiesanTime");
    },
    //继续游戏 发送一个不退出请求   拒绝解散房间
    goonGameClick: function () {
        if (cc.sys.localStorage.getItem("userOverBtn") != 1) {
            let REFUSE = true;
            var oper = new cc.Event.EventCustom('overGame', true);
            oper.setUserData(REFUSE);
            this.node.dispatchEvent(oper);
        }
        cc.sys.localStorage.removeItem("userOverBtn");
    },
    //退出游戏，点击确定离开btn
    leaveGameClick: function () {
        var msg = {
            token: cc.weijifen.authorization,
            orgi: cc.weijifen.GameBase.gameModel,
        }
        var self = cc.find('Canvas/alert').getComponent('Alert');
        cc.weijifen.http.httpPost('/apps/platform/room/quit', msg, function (data) {
            var data = JSON.parse(data);
            if (data.success) {
                var a = {};
                a.key = true;
                var oper = new cc.Event.EventCustom('restar', true);
                oper.setUserData(a);
                cc.find('Canvas/bg').dispatchEvent(oper);
            } else {
                self.upMsg.getComponent(cc.Label).string = data.msg;
            }
        }.bind(self),
            function () {
                self.upMsg.getComponent(cc.Label).string = '离开失败，请稍后重试';
            }.bind(self));
    },
    refresh: function (obj) {

    },
    closeAlert: function (obj) {
        var temp = obj.schedule(
            function () {
                for (var i = obj.list.childrenCount - 1; i > 0; i--) {
                    obj.list.children[i].destroy();
                }
                cc.weijifen.alert.put(obj.node);
                obj.unschedule(temp);
            }, 3000, 1
        );
    },
    showPlayerImg: function (src) {
        var arr = cc.find('Canvas').getComponent('MJDataBind').playersarray;
        var array = [];
        for (var i in arr) {
            var mjplayer = arr[i].getComponent('MJPlayer');
            var bol = true;
            for (var j in array) {//playersarray里面会出现重复的现象
                if (array[j] == mjplayer.id.string) {
                    bol = false;
                    break;
                }
            }
            var item = cc.instantiate(src.list.children[0]);
            var sprites = item.getComponent(cc.Sprite);
            if (item && bol) {
                sprites.SpriteFrame = mjplayer.headImg.getComponent(cc.Sprite).SpriteFrame;
                item.getChildByName('id').getComponent(cc.Label).string = mjplayer.id.string;
                array.push(mjplayer.id.string);
                item.active = true;
                item.parent = src.list;
            }

        }
    },
    // update (dt) {},
});
