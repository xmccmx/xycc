/*cc.Class({
    extends: cc.Component,

    properties: { 
        bgAudioID:-1            //   背景 音乐  id
    },

    // use this for initialization
    init: function () {
        cc.game.on(cc.game.EVENT_HIDE, function () {
            cc.audioEngine.pauseAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            if(cc.sys.localStorage.getItem('nobgm') != 'true'){
                cc.audioEngine.resumeAll();
            }  
        });
    },  
    _getUrl:function(url){
        return cc.url.raw("resources/sounds/" + url);
    },
    playBGM(url){
        var audioUrl = this._getUrl(url);
        if(this.bgAudioID >= 0){
            cc.audioEngine.stop(this.bgAudioID);
        }
        this.bgAudioID = cc.audioEngine.play(audioUrl,true,this.bgVolume);
    },
    playSFX(url){
        var audioUrl = this.getUrl(url);
        if(this.deskVolume > 0){
            var audioId = cc.audioEngine.play(audioUrl,false,this.deskVolume);    
        }
    },
    getState:function(){
        return cc.audioEngine.getState(this.bgAudioID);
    },
    pauseAll:function(){
        cc.audioEngine.pauseAll();
    },
    resumeAll:function(){
        cc.audioEngine.resumeAll();
    }
});
*/
var hide = function () {
    cc.audioEngine.pauseAll();
    if (cc.director.getScene().name != 'majiang') return;
    console.log('监听到hide事件，游戏进入后台运行！');
    let param = {
        userId: cc.weijifen.user.id,
        // userId: '37a538a553bf4e88820893274669992f',
        type: 4,
        status: 1
    };
    if (cc.weijifen.socket) cc.weijifen.socket.emit("sayOnSound", JSON.stringify(param));
}
var show = function () {
    if (cc.sys.localStorage.getItem('nobgm') != 'true') {
        cc.audioEngine.resumeAll();
    }
    if (cc.director.getScene().name != 'majiang') return;
    console.log('监听到SHOW事件，游戏进入后台运行！');
    cc.sys.localStorage.setItem("isHide", 0);
    let param = {
        userId: cc.weijifen.user.id,
        // userId: '37a538a553bf4e88820893274669992f',
        type: 4,
        status: 0
    };
    if (cc.weijifen.socket) cc.weijifen.socket.emit("sayOnSound", JSON.stringify(param));
    if (cc.weijifen.room) {
        cc.weijifen.wjf.scene('majiang');
    }
}
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        bgVolume: 0.5,           // 背景音量

        deskVolume: 1.0,         //   房间 房间音量

        bgAudioID: -1            //   背景 音乐  id
    },

    // use this for initialization
    init: function () {
        var t = cc.sys.localStorage.getItem("bgVolume");
        if (t != null) {
            this.bgVolume = parseFloat(t);
        }

        var t = cc.sys.localStorage.getItem("deskVolume");

        if (t != null) {
            this.deskVolume = parseFloat(t);
        }

        cc.game.on(cc.game.EVENT_HIDE, hide);
        cc.game.on(cc.game.EVENT_SHOW, show);

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    getUrl: function (url) {
        return ("sounds/" + url);
        // return cc.url.raw("resources/sounds/" + url);
    },

    playBGM(url) {
        var audioUrl = this.getUrl(url);
        if (this.bgAudioID >= 0) {
            cc.audioEngine.stop(this.bgAudioID);
        }
        var self = this;
        // this.bgAudioID = cc.audioEngine.play(audioUrl,true,this.bgVolume);
        cc.loader.loadRes(audioUrl, cc.AudioClip, function (err, clip) {
            if (clip) {
                var value = self.bgVolume;
                self.bgAudioID = cc.audioEngine.play(clip, true, value);
            }
            if (err) {
                console.log(err);
            }
        });
    },

    playSFX(url) {
        var audioUrl = this.getUrl(url);
        var self = this;
        if (this.deskVolume > 0) {
            // var audioId = cc.audioEngine.play(audioUrl,false,this.deskVolume);    
            cc.loader.loadRes(audioUrl, cc.AudioClip, function (err, clip) {
                if (clip) {
                    var value = self.bgVolume;
                    self.bgAudioID = cc.audioEngine.play(clip, false, value);
                }
                if (err) {
                    console.log(err);
                }
            });
        }
    },

    setSFXVolume: function (v) {
        if (this.sfxVolume != v) {
            cc.sys.localStorage.setItem("deskVolume", v);
            this.deskVolume = v;
        }
    },
    getSFXVolume: function () {
        return cc.sys.localStorage.getItem('deskVolume');
    },
    getState: function () {
        return cc.audioEngine.getState(this.bgAudioID);
    },
    getBGMVolume: function () {
        return cc.audioEngine.getVolume(this.bgAudioID);
    },
    setBGMVolume: function (v, force) {
        if (this.bgAudioID >= 0) {
            if (v > 0 && cc.audioEngine.getState(this.bgAudioID) === cc.audioEngine.AudioState.PAUSED) {
                cc.audioEngine.resume(this.bgAudioID);
            } else if (v == 0) {
                cc.audioEngine.pause(this.bgAudioID);
            }
        }
        if (this.bgVolume != v || force) {
            cc.sys.localStorage.setItem("bgVolume", v);
            this.bgmVolume = v;
            cc.audioEngine.setVolume(this.bgAudioID, v);
        }
    },

    pauseAll: function () {
        cc.audioEngine.pauseAll();
    },

    resumeAll: function () {
        cc.audioEngine.resumeAll();
    }
});
