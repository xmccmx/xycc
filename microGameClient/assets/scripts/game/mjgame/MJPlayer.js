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
        headImg: cc.Node,
        unLineImg: cc.Node,
        calling:cc.Node,
        nameLabel: cc.Label,
        scoreLabel: cc.Label,
        zhuangNode: cc.Node,
        yuyinNode: cc.Node,
        kuang: cc.Sprite,
        ting: cc.Node,
        id:cc.Label,
        headBorder: {
            default: [],
            type: cc.SpriteFrame,
        },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.refresh();//预制初始化，不想放在onload中调用可以放在unuse中
    },
    refresh: function () {
        this.data = null;
        this.tablepos = null;
        this.nameLabel.string = '';
        this.scoreLabel.string = '';
        this.headImg.getComponent(cc.Sprite).spriteFrame = this.imgs;
        this.kuang.spriteFrame = this.headBorder[3];
        this.zhuangNode.active = false;
        this.yuyinNode.active = false;
        this.unLineImg.active = false;
    },
    init: function (playerdata, tablepos) {
        this.data = playerdata;    //存放玩家数据
        this.tablepos = tablepos; // 方位
        this.id.string=playerdata.id;
        if (!playerdata.online) {
            this.unLineImg.active = true;
            this.headImg.color = new cc.Color(100, 100, 100);
        } else {
            this.unLineImg.active = false;//是否离线
            this.headImg.color = new cc.Color(255, 255, 255);
        }
        if (tablepos) {
            cc.find('Canvas/players/head_' + tablepos).children[0].active = false;
        }
        if (playerdata.headimgurl) {
            var imgurl = playerdata.headimgurl;
            var sprite = this.headImg.getComponent(cc.Sprite);
            var head = this.headImg;
            cc.loader.load({ url: imgurl, type: 'jpg' }, function (suc, texture) {
                if (suc) {
                    console.log(suc);
                }
                if (texture) {
                    sprite.spriteFrame = new cc.SpriteFrame(texture);
                    head.width = 90;
                    head.height = 90;
                }
            });
        }
        this.nameLabel.string = playerdata.username||'';
        this.scoreLabel.string = playerdata.goldcoins;
        // 头像框
        var vipLevel = playerdata.playerlevel;
        if (vipLevel == 2) {
            this.kuang.spriteFrame = this.headBorder[0];//vip
            return
        }
        if (vipLevel == 1) {
            this.kuang.spriteFrame = this.headBorder[1];//千人vip
            return
        }
        if (vipLevel == 0) {
            this.kuang.spriteFrame = this.headBorder[2];//万人vip
            return
        }
    },

    // update (dt) {},
});
