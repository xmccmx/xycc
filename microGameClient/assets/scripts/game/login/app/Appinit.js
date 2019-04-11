var WJFCommon = require("WJFCommon");
cc.Class({
    extends: WJFCommon,

    properties: {
        loaddingPrefab: {
            default: null,
            type: cc.Prefab
        },
        alertPrefab: {
            default: null,
            type: cc.Prefab
        },
        menuPrefab: {
            default: null,
            type: cc.Prefab
        },
    },
    // use this for initialization
    onLoad: function () {
        var GameBase = { 'gameModel': 'ch' };
        this.initMgr(GameBase);
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var canvas = this.node.getComponent(cc.Canvas);
            canvas.fitHeight = true;
            canvas.fitWidth = true;
        }
    },
    init: function (GameBase) {
        cc.weijifen.audio.init();
        cc.weijifen.dialogtwo = null;
        cc.weijifen.paystatus = null;
        cc.weijifen.matchTime = null;
        cc.weijifen.starttime = ''
        cc.weijifen.GameBase = GameBase;
        cc.weijifen.settingflag = false;
        cc.weijifen.seckey = "weijifen";
        cc.weijifen.loadding = new cc.NodePool();
        cc.weijifen.loadding.put(cc.instantiate(this.loaddingPrefab)); // 创建节点
        cc.weijifen.alert = new cc.NodePool();
        cc.weijifen.alert.put(cc.instantiate(this.alertPrefab)); // 创建节点
        cc.weijifen.alert.put(cc.instantiate(this.alertPrefab));
        cc.weijifen.menu = new cc.NodePool('menuSet');
        cc.weijifen.menu.put(cc.instantiate(this.menuPrefab));//菜单框
        //单击/双击
        cc.weijifen.click = cc.sys.localStorage.getItem('click');
        //游戏场景的背景
        cc.weijifen.bgcolor = cc.sys.localStorage.getItem('bgcolor');
        cc.weijifen.cardPostion = {
            x: 540,
            y: -300
        };
        cc.weijifen.genders = {
            current: null,
            right: null,
            top: null,
            left: null
        }
        cc.weijifen.cardcolor = cc.sys.localStorage.getItem('cardcolor');
        //唱戏场景的麻将牌花色
        cc.sys.localStorage.setItem('cardcolor', 'yellow');
        cc.sys.localStorage.removeItem('replayData');
        //预加载majiang场景
        cc.weijifen.wjf.loadding();
        cc.director.preloadScene('majiang', function (err) {
            cc.weijifen.wjf.closeloadding();
        });
    },
    initMgr: function (GameBase) {
        if (cc.weijifen == null) {
            cc.weijifen = {};

            let HTTP = require('HTTP');
            cc.weijifen.http = HTTP;

            var Audios = require("Audios");
            cc.weijifen.audio = new Audios();

            let wjf = require('WJFCommon');
            cc.weijifen.wjf = new wjf();

            let ri = require('RoomInit');
            cc.weijifen.roomInit = new ri();

            let al = require('Alert');
            cc.weijifen.alertjs = new al();

            let settingClick = require('settingClick');
            cc.weijifen.settingClick = new settingClick();

            var rooninit = require('RoomInit');
            cc.weijifen.roomInit = new rooninit();

            let gameStartInit = require('GameStartInit');
            cc.weijifen.gameStartInit = new gameStartInit();

            let gameEvent = require('GameEvent');
            cc.weijifen.gameEvent = new gameEvent();

            let gamePlay = require('GamePlay');
            cc.weijifen.gamePlay = new gamePlay();

            cc.weijifen.MJ = require('MJDataBind');



            // let h5CallCocos = require('h5CallCocos');
            // cc.weijifen.match = new h5CallCocos();

            if (cc.sys.isNative) {
                window.io = SocketIO;
            } else {
                window.io = require("socket.io");
            }

            //播放背景音乐
            if (cc.sys.localStorage.getItem('nobgm') != 'true') {
                cc.weijifen.audio.playBGM("bgFight");
            }
            // HTTP.wsURL = '121.40.98.233:9081';
            /*  cc.weijifen.http.httpGet('/apps/platform/find/server/address?orgi='+ cc.weijifen.GameBase.gameModel,function(res){
                  HTTP.wsURL = res;
              },function(err){console.log('请求出错')},he);*/

            this.init(GameBase);
        }
    },
    downApp: function () {
        let object = this;
        let url = cc.sys.localStorage.getItem('appUrl');
        cc.find('Canvas/downLoadApp').active = false;
        if (!cc.sys.isNative) return;
        // var res = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", "openView",url);
        var res = jsb.reflection.callStaticMethod(...object.anMethodParam().openView, url);
    },
    hideDownTips: function () {
        cc.find('Canvas/downLoadApp').active = false;
    },

});
