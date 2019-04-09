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
    onClick: function (event) {//准备Btn
        var param = {
            token: cc.weijifen.authorization,
            playway: cc.weijifen.playway,
            orgi: cc.weijifen.user.orgi
        };
        if (cc.weijifen.room) {
            param.room = cc.weijifen.room;
        }
        this.node.dispatchEvent(new cc.Event.EventCustom('readyGM', true));
    },
    /*分享好友*/
    showActive: function () {
        if (!cc.weijifen.dataOps) {
            cc.weijifen.dataOps = "心缘竞技"
        }
        let object = cc.find('Canvas').getComponent('MJDataBind');
        let players = cc.find('Canvas/players');
        var count = 1;
        for (let i = 0; i < 3; i++) {
            if (players.children[i].active) {
                count++;
            }
        }
        var types = '快闪局';
        var num = cc.find("Canvas/roomNum/quanSprite/quanNum").getComponent(cc.Label).string;
        if (num[2] != '1') {
            types = '普通局';
        }
        var jsonData = {
            url: "http://game.bizpartner.cn/wxController/toCHAuthAgainWx?roomNum=" + cc.weijifen.room + "&invitationcode=" + cc.weijifen.user.invitationcode,
            title: "心缘竞技",
            context: types + " 房间：" + cc.weijifen.room + "  玩法:" + cc.weijifen.dataOps + '  人数:' + object.playersarray.length + '/' + count,
            conType: 1,
            msgType: 1
        }
        var res = jsb.reflection.callStaticMethod(...object.anMethodParam().shareEvent, JSON.stringify(jsonData));
        return;
    },
    /**
        * 新创建牌局，首个玩家加入，进入等待状态，等待其他玩家加入，服务端会推送 players数据
        * @param data
        * @param context
        */
    joinroom_event: function (data, context) {
        let roomInit = cc.weijifen.roomInit;
        cc.weijifen.dataOps = data.playWayOp;//房间玩法
        if (cc.sys.localStorage.getItem('waitting') != 1) {
            cc.sys.localStorage.setItem('waitting', 'true');// (在游戏未开始时只有房主可以解散房间) 玩家等待中
        }
        //如果是2人的模式  就只加自己和对家
        // 反作弊提示
        if (data.msg) {
            let I = cc.find('Canvas/AllTips/IpLabel');
            I.active = true;
            I.getComponent(cc.Label).string = data.msg;
        }
        if (cc.weijifen.playerNum == 2) {
            if (data.id != cc.weijifen.user.id && data.id != cc.sys.localStorage.getItem('top') || (typeof cc.weijifen.match == 'function' || cc.weijifen.match == 'true') && data.id == cc.weijifen.user.id) {
                var player = context.playerspool.get();
                var playerscript = player.getComponent("MJPlayer");
                var tablepos = "";
                if (data.id == cc.weijifen.user.id) {
                    tablepos = 'current';
                    roomInit.playerPosition(player, 'current', data, '0');
                } else {
                    tablepos = 'top';
                    roomInit.playerPosition(player, 'top', data, '2');
                }
                playerscript.init(data, tablepos);
                context.playersarray.push(player);
                if (data.status == 'READY' && !cc.weijifen.banker) {
                    roomInit.readyHandle(tablepos, context, data);
                }
            } else {
                roomInit.returnRoom(context, data);
            }
        } else if (cc.weijifen.playerNum == 3) {
            if (data.id != cc.sys.localStorage.getItem('current') && data.id != cc.sys.localStorage.getItem('right') && data.id != cc.sys.localStorage.getItem('top') || (typeof cc.weijifen.match == 'function' || cc.weijifen.match == 'true') && data.id == cc.sys.localStorage.getItem('current')) {
                var player = context.playerspool.get();
                var playerscript = player.getComponent("MJPlayer");
                var tablepos = "", num;
                var inx = cc.sys.localStorage.getItem('count');
                if (data.id == cc.weijifen.user.id) {
                    tablepos = 'current';
                    num = '0';
                } else {
                    if (inx == 0 || inx == 2) {
                        tablepos = 'right';
                        num = '1';
                    } else if (inx == 1) {
                        tablepos = 'top';
                        num = '2';
                    }
                }
                roomInit.playerPosition(player, tablepos, data, num);
                playerscript.init(data, tablepos);
                context.playersarray.push(player);
                //这里是用来判定自己重连的时候 如果已经准备了 则准备按钮消失
                if (data.status == 'READY' && !cc.weijifen.banker) {
                    roomInit.readyHandle(tablepos, context, data);
                }
            } else {
                roomInit.returnRoom(context, data);
            }
        } else {
            // 这是默认的4人模式 
            // 因为 加入会触发 改变状态也会触发该事件，所以用getitem保存一个数据 如果有了这个数据则 只判断状态的改变  如果没有则表示新玩家加入
            if (data.id != cc.sys.localStorage.getItem('current') && data.id != cc.sys.localStorage.getItem('right') && data.id != cc.sys.localStorage.getItem('left') && data.id != cc.sys.localStorage.getItem('top') || (typeof cc.weijifen.match == 'function' || cc.weijifen.match == 'true') && data.id == cc.sys.localStorage.getItem('current')) {
                var player = context.playerspool.get();
                var playerscript = player.getComponent("MJPlayer");
                var tablepos = "", num;
                var inx = cc.sys.localStorage.getItem('count');
                if (data.id == cc.weijifen.user.id) {
                    tablepos = 'current';
                    num = '0';
                } else {
                    if (inx == 0 || inx == 3) {
                        tablepos = 'right';
                        num = '1';
                    } else if (inx == 1) {
                        tablepos = 'top';
                        num = '2';
                    } else if (inx == 2) {
                        tablepos = 'left';
                        num = '3';
                    }
                }
                roomInit.playerPosition(player, tablepos, data, num);
                playerscript.init(data, tablepos);
                context.playersarray.push(player);
                //这里是用来判定自己重连的时候 如果已经准备了 则准备按钮消失
                if (data.status == 'READY' && !cc.weijifen.banker) {
                    roomInit.readyHandle(tablepos, context, data);
                }
            } else {
                roomInit.returnRoom(context, data);
            }
        }

    },
    readyHandle(tablepos, context, data) {
        cc.find('Canvas/players/ok_' + tablepos + '').active = true;
        if (data.id == cc.weijifen.user.id) {
            context._btnNode.getChildByName('readyBtn').active = false;
            context._btnNode.getChildByName('friendBtn').active = false;
        }
    },
    playerPosition(player, tablepos, data, count) {
        player.setPosition(0, 0);
        let par = cc.find('Canvas/players/head_' + tablepos + '');
        if (cc.sys.localStorage.getItem("replayData") != null) {
            if (cc.sys.os != cc.sys.OS_ANDROID) {
                if (par.getChildByName('player_head')) return;
            }
        } else {
            if (par.getChildByName('player_head')) return;
        }
        player.parent = par;
        cc.sys.localStorage.setItem(tablepos, data.id);
        if (count) cc.sys.localStorage.setItem('count', count);
    },
    //返回游戏房间
    returnRoom(context, data) {
        var gameStartInitNode = cc.find('Canvas').getComponent('GameStartInit');
        var playerarray = context.playersarray;
        if (playerarray) {
            for (let i = 0; i < playerarray.length; i++) {
                var playerinfo = playerarray[i].getComponent('MJPlayer');
                var tablepos = playerinfo.tablepos;
                var on_off_line = playerinfo.unLineImg;
                var headimg = playerinfo.headImg;
                if (data.id == playerinfo.id.string) {
                    if (data.status == 'READY') {//在发牌之后不应该再显示ok手势
                        if (!cc.weijifen.banker || context.playercards.length == 0) {
                            let ok = cc.find('Canvas/players/ok_' + tablepos + '');
                            if (ok) ok.active = true;
                        }
                        if (data.id == cc.weijifen.user.id) {
                            context._btnNode.getChildByName('readyBtn').active = false;
                            context._btnNode.getChildByName('friendBtn').active = false;
                        }
                    }
                    if (data.online == false) {
                        on_off_line.active = true;
                        headimg.color = new cc.Color(42, 25, 25);
                        headimg.color = new cc.Color(100, 100, 100);
                    } else {
                        on_off_line.active = false;
                        headimg.color = new cc.Color(255, 255, 255);
                    }
                    if (gameStartInitNode._cardsCount.string != '136') {
                        context.readyNoActive(context);  //剩余牌数小于136说明已经开局，隐藏所有准备状态
                    }
                }
            }
        }
    },
    // update (dt) {},
});
