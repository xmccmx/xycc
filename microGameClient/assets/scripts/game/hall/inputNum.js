var WJFCommon = require("WJFCommon");

var array = "";
cc.Class({
    extends: WJFCommon,

    properties: {
        cardNum: cc.Label,
        inputNum1: {
            default: null,
            type: cc.Label
        },
        inputNum2: {
            default: null,
            type: cc.Label
        },
        inputNum3: {
            default: null,
            type: cc.Label
        },
        inputNum4: {
            default: null,
            type: cc.Label
        },
        inputNum5: {
            default: null,
            type: cc.Label
        },
        inputNum6: {
            default: null,
            type: cc.Label
        },
        notice: {
            default: null,
            type: cc.Label
        },
        numArr: [],
    },

    onLoad: function () {
        this.emptyClick();
        this.numArr = [this.inputNum1, this.inputNum2, this.inputNum3, this.inputNum4, this.inputNum5, this.inputNum6];
        // if(this.cardNum){
        //     this.cardNum.string =  cc.weijifen.user.cards + '张'
        // }
        // if(this.zhoupic){
        //     cc.weijifen.http.httpGet('/api/room/queryUserWinner?token='+cc.weijifen.authorization,this.countsucess,this.counterror,this);            
        // }
    },
    /*
    * 房间号监听输入
    */
    clickNum: function (event) {
        if (array.length >= 6) {
            return;
        }
        var num = event.currentTarget.name;
        this.numArr[array.length].string = num;
        array += num;
        if (array.length == 6) {
            this.click();
        }
    },
    /*
    * 房间号已经是6位，可以进入
    */
    click: function (roomNum) {
        if (roomNum) {
            array = roomNum;
        }
        var room = {};
        room.room = array;
        if (cc.weijifen.authorization) {
            if (cc.weijifen.room) {
                room.room = cc.weijifen.room;
            } else {
                cc.weijifen.room = array;
            }
            room.token = cc.weijifen.authorization;
            cc.weijifen.http.httpPost('/api/room/query', room, this.JRsucess, this.JRerror, this);
        } else {
            this.notice.getComponent('cc.Label').string = '登录状态失效,请重新登录!';
        }
    },
    JRsucess: function (result, object) {
        var data = JSON.parse(result);
        if (cc.weijifen.room == null) cc.weijifen.room = array;
        if (data.playway && data.room) {
            cc.weijifen.playway = data.playway;
            if (data.match) {
                cc.weijifen.match = data.match;
            }
            if (data.game) {
                cc.weijifen.playType = data.game;
            }
            if (data.playerNum) {
                cc.weijifen.playerNum = data.playerNum;
            }
            if (data.cardNum) {
                cc.weijifen.cardNum = data.cardNum;
            }
            if (data.maxRound) {
                cc.weijifen.maxRound = data.maxRound;
            } else if (data.maxRound == 0) {
                cc.weijifen.maxRound = 1;
            }
            cc.weijifen.wjf.scene('majiang');
        } else if (data.error) {
            if (!object.notice) {
                cc.weijifen.wjf.alert(data.msg, null, 1, null, null);
                return
            }
            object.notice.string = data.msg;
            cc.weijifen.room = null;
            // if (cc.weijifen.user.cards == 0) {-------------
            //     cc.weijifen.dialog.destroy();
            //     cc.weijifen.dialog = null;
            //     cc.weijifen.dialog = cc.instantiate(object.shopping);
            //     cc.weijifen.dialog.parent = cc.find('Canvas');
            // }
        }
    },
    JRerror: function (object) {
        object.notice.string = '连接失败';
        cc.weijifen.room = null;
    },
    //清空按钮
    emptyClick: function () {
        array = "";
        this.notice.string = '';
        for (let i in this.numArr) {
            this.numArr[i].string = '';
        }
    },
    //删除按钮
    removeOneClick: function () {
        if (array != "") {
            this.numArr[array.length - 1].string = '';
            array = array.substr(0, array.length - 1);
        }
    },
    helpClick: function () {
        cc.weijifen.dialog1 = cc.instantiate(this.help);
        cc.weijifen.dialog1.parent = this.root();
    },
    jjroom: function (event) {
        let type = event.target.name;
        let arry = event.target.children[0].getComponent(cc.Label).string.split(' ')
        cc.weijifen.starttime = arry[1];
        this.loadding();
        cc.weijifen.http.httpGet('/api/room/match?token=' + cc.weijifen.authorization + '&type=' + type, this.jjsucess, this.jjerror, this);
    },
    jjsucess: function (result, object) {

        var data = JSON.parse(result);
        //playerNum,cardNum
        if (data.error) {
            object.closeloadding();
            object.alert2('比赛未开始或者您没资格进入比赛');
        } else {
            if (data.match) {
                cc.weijifen.match = data.match;
            }
            if (data.playway) {
                cc.weijifen.playway = data.playway;
            }
            if (data.room) {
                cc.weijifen.room = data.room;
            }
            if (data.playerNum) {
                cc.weijifen.playerNum = data.playerNum;
            }
            if (data.cardNum) {
                cc.weijifen.cardNum = data.cardNum;
            }
            if (data.maxRound) {
                cc.weijifen.maxRound = data.maxRound;
            } else if (data.maxRound == 0) {
                cc.weijifen.maxRound = 1;
            }
            cc.weijifen.wjf.scene('majiang');
        }
    },
    jjerror: function (result, object) {
        object.closeloadding();
        object.alert2('比赛未开始或者您没资格进入比赛');
    }
});
