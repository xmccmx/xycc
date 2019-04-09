//创建房间panel自适应和创建房间btn功能
var moShi, playerData, userType;
cc.Class({
    extends: cc.Component,

    properties: {
        temp: cc.Node,
        parents: cc.Node,
        isKuaiSan: false,
        _kuaiSan: false,
        zero: cc.Node,//一局
    },
    onLoad: function () {
        if (cc.weijifen.matchFlag) {
            this.allfunction(['日赛', '月赛'], [this.matchHall, this.matchHall]);//-------------
            return
        }
        if (cc.weijifen.GameBase.gameModel == 'ch') {
            playerData = "both@@bandgap@@xjmissile@@sfmissile@@xdszl@@";
            moShi = '4';
            userType = "4";
            this._kuaiSan = false;
            this.allfunction(['长春麻将'], [this.left]);
        } else if (cc.weijifen.GameBase.gameModel == 'wz') {
            this.allfunction(['龙港麻将', '台炮麻将'], [this.lg, this.tp]);
        } else if (cc.weijifen.GameBase.gameModel == 'jx') {
            this.allfunction(['平湖麻将'], [this.ph]);
        } else if (cc.weijifen.GameBase.gameModel == 'nj') {
            this.allfunction(['南京麻将'], [this.nj]);
        } else if (cc.weijifen.GameBase.gameModel == 'ls') {
            // this.allfunction(['壶镇麻将','经典麻将'],[this.gd,this.jy]);
            this.allfunction(['经典麻将', '广式麻将', '杭州麻将'], [this.jy, this.gd, this.hangz]);
        }
    },
    allfunction: function (name, value) {
        for (let i in name) {
            let he = cc.instantiate(this.temp);
            he.active = true;
            he.parent = this.parents;
            he.children[2].getComponent(cc.Label).string = name[i];
            let her = he.children[1].children[0];
            if (name[i] == '长春麻将' && this.isKuaiSan) {
                var moshi = her.children[0].children[1];
                this._kuaiSan = true;
                moshi.children[0].active = false;
                moshi.children[1].active = false;
                moshi.children[3].active = true;
                moshi.children[3].setPosition(-96, 4);
                this.zero.color = new cc.color(255, 210, 90, 255);
            }
            if (name[i] == '月赛') her.y = -98;
            var toggle = he.getComponent(cc.Toggle);
            i == 0 ? toggle.isChecked = true : null;
        }
    },
    changeColor: function (item) {
        item.color.b == 90 ? item.color = new cc.color(255, 255, 255, 255) : item.color = new cc.color(255, 210, 90, 255);
    },
    btnClick: function (event) {
        var item = event.target, obj;
        if (item.parent.parent.name == '玩法') {
            this.changeColor(item.parent.children[2]);
            if (event.isChecked) {
                playerData += item.parent.name + "@@";
            } else {
                playerData = playerData.replace(item.parent.name + "@@", "");
            }
            return;
        }
        item.parent.parent.parent.name == '人数' ? obj = item.parent.parent.getChildByName(userType) : obj = item.parent.parent.getChildByName(moShi);
        if (obj.name != item.name) {
            //选中改变颜色 //上一个选中的字体恢复为默认色
            item.parent.parent.parent.name == '人数' ? userType = item.name : moShi = item.name;
            this.changeColor(item.parent.children[2]);
            this.changeColor(obj.children[2]);
        }
    },
    createClick: function () {
        playerData = playerData.split("@@");
        playerData.pop();
        if (this._kuaiSan) moShi = '0';
        let data = {
            waytype: playerData,
            game: 'CH',
            pepNums: userType,
            modeltype: moShi,
            token: cc.weijifen.authorization,
        };
        cc.weijifen.wjf.loadding();
        cc.weijifen.http.httpPost('/api/room/create', data, this.sucess, this.error, this);
    },
    sucess: function (result, object) {
        var data = JSON.parse(result);
        cc.weijifen.wjf.closeloadding();
        if (data.room && data.playway) {
            cc.weijifen.wjf.getGame(data);//放置参数
            cc.weijifen.wjf.scene('majiang');
        } else if (data.error) {
            cc.weijifen.wjf.alert(data.msg, null, 1, null, null);
        } else {
            cc.weijifen.wjf.alert('请求失败', null, 1, null, null);
        }
        cc.weijifen.wjf.wrong();//将menu预制放回对象池
    },
    error: function (object) {
        cc.weijifen.wjf.wrong();//将menu预制放回对象池
        cc.weijifen.wjf.closeloadding();
        cc.weijifen.wjf.alert('连接出错,请稍后重试!', null, 1, null, null);
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
