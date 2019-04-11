var weijifenCommon = require("WJFCommon");
var tongyi = true;
var a = 1;
cc.Class({
    extends: weijifenCommon,
    properties: {
        agree:{
            default:null,
            type: cc.Node
        },
        loginLogoNode:{
            default:null,
            type:cc.Node
        },
        WZLogo:{
            default:null,
            type:cc.SpriteFrame
        },
        CCLogo:{
            default:null,
            type:cc.SpriteFrame
        },
        JXLogo:cc.SpriteFrame,
        NJLogo:cc.SpriteFrame,
        LSLogo:cc.SpriteFrame,
    },
    // 首次加载页面方法
    onLoad: function () {
        var type_id;
        var self = this;
        self.jsbParams = null;// type: ,jsb所需参数
        var platForm = self.clientPlatForm();
        cc.sys.localStorage.setItem('version','1.1.9');
        // 改版本
        var sprite = this.loginLogoNode.getComponent(cc.Sprite);
        self.clientPlatForm() == 'IOS' ? type_id = 1 : type_id = 0;
        let youkeBtn = cc.find("Canvas/loginBG/youkeBtn");
        let wxBtn = cc.find("Canvas/loginBG/wechatBtn");
        // let rightTopLogo = cc.find("Canvas/global/image/xuntianyou");
        // cc.weijifen.http.httpGet('? ='+cc.weijifen.GameBase.gameModel+'& ='+platForm,self.getParam,self.error,self) ;  
        if(cc.weijifen.GameBase.gameModel =='wz'){
            sprite.spriteFrame = this.WZLogo;
            this.loginLogoNode.width=440;
            this.loginLogoNode.height=150;
        }else if(cc.weijifen.GameBase.gameModel == 'ch'){
            sprite.spriteFrame = this.CCLogo;
            //隐藏游客登录按钮
            //  youkeBtn.active = false;
            //微信登录按钮剧中
            wxBtn.setPosition(0,-210);
        }else if(cc.weijifen.GameBase.gameModel == 'jx'){
            sprite.spriteFrame = this.JXLogo;
            // rightTopLogo.active = false;
            this.loginLogoNode.width = 480;
            this.loginLogoNode.height = 120;
        }else if(cc.weijifen.GameBase.gameModel == 'nj'){
            // rightTopLogo.active = false;
            youkeBtn.active = false;
            sprite.spriteFrame = this.NJLogo;
            this.loginLogoNode.width = 480;
            this.loginLogoNode.height = 120;
        }else if(cc.weijifen.GameBase.gameModel == 'ls'){
            youkeBtn.active = false;
            // rightTopLogo.active = false;
            sprite.spriteFrame = this.LSLogo;
            this.loginLogoNode.width = 480;
            this.loginLogoNode.height = 120;
        }
        cc.weijifen.wxAuth = function(code) {
            self.login(code,self) ;
        };
        // 检测是否重新下载app 
        cc.weijifen.http.httpGet('/gameVersion/findVersionNum?orgi='+cc.weijifen.GameBase.gameModel + '&type_id=' + type_id,self.updateSuccess,self.error,self) ;  
        cc.weijifen.game = {
            model : null ,
            playway : null,
            type:function(name){
                var temp ;
                if(cc.weijifen.game.model !=null){
                    for(var i=0 ; i<cc.weijifen.game.model.types.length ; i++){
                        var type = cc.weijifen.game.model.types[i] ;
                        if(type.code == name){
                            temp = type ;
                        }
                    }
                }
                return temp ;
            }
        };
        //app支付初始化
        cc.weijifen.pay = function(shopId) {
            // 虎皮椒支付页面
            let result = `${cc.weijifen.http.baseURL}/hpjPay/goPayPage?shopId=${shopId}&token=${cc.weijifen.authorization}`;
            
            
            // let result = 'http://game.daily.bizpartner.cn/hpjPay/goPayPage?shopId=' + shopId + '&token=' + cc.weijifen.authorization;
            if (self.clientPlatForm() == 'IOS') {
                // let result = `http://game.bizpartner.cn/hpjPay/goPayPage?shopId=${shopId}&token=${cc.weijifen.authorization}`;
                var res = jsb.reflection.callStaticMethod("AppController","iPayHandler:",result);
                // cc.weijifen.http.httpGet("/ipay/IOSsign?token="+cc.weijifen.authorization+"&shopId="+shopId, self.signSucess , self.error , self);// 爱贝支付
            } else if (self.clientPlatForm() == 'ANDROID') {// 安卓
                var res = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager","raiseEvent","(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;",'openView',result);
                // var res = jsb.reflection.callStaticMethod(...self.anMethodParam().openview,result);// 爱贝支付
            }
        };
        //获取分享进入的时候，是否分享的游戏房间
        // var res = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", "shareParam","");
        // var res = jsb.reflection.callStaticMethod(self.anMethodParam()[0],self.anMethodParam()[1],self.anMethodParam()[2], "shareParam","");
        /*var res = jsb.reflection.callStaticMethod(...self.anMethodParam().shareParam);
        if(res){
            var result1 = JSON.parse(res);
            if (self.clientPlatForm() == 'IOS') {
                cc.weijifen.shareRoomNum = res;
            } else if (self.clientPlatForm() == 'ANDROID' && result1.code != "10086" && result1.roomNum) {
                cc.weijifen.shareRoomNum = result1.roomNum;
            }
            cc.weijifen.http.httpGet('/userInfo/query/token?userId='+cc.weijifen.user.id,object.tokenSuccess,object.carderror,object);
        }*/
        
    },
    updateSuccess:function (result,object) {
    	result = JSON.parse(result);
        if (result.success && result.version != cc.sys.localStorage.getItem('version')) {
            cc.find('Canvas/downLoadApp').active = true;
            cc.sys.localStorage.setItem('appUrl',result.url);
        }
    },
    signSucess:function(result , object){
        // var res = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", "iPayHandler",result);
        var res = jsb.reflection.callStaticMethod(...object.anMethodParam().iPayHandler,result);
    },
    err:function(result , object) {
        
    },

    //游客登录方法
    tourist: function(){
        if(tongyi){
            this.loadding();
            if(cc.sys.localStorage.getItem('userinfo') == null){
                //发送游客注册请求
                var xhr = cc.weijifen.http.httpGet("/api/guest", this.guestSucess , this.error , this);
            }else{
                //通过ID获取 玩家信息
                var data = JSON.parse(cc.sys.localStorage.getItem('userinfo')) ;
                if(data.token != null){     //获取用户登录信息
                    var xhr = cc.weijifen.http.httpGet("/api/guest?token="+data.token.id, this.guestSucess , this.error , this);
                }
            }
        }else{
            this.alert('请查看并同意用户使用协议');
        }     
    },
    //同意协议内容
    click: function(toggle){
        tongyi = toggle.isChecked;
    },
    guestSucess:function(result , object){
        var data = JSON.parse(result) ;
        if(data!=null && data.token!=null && data.data!=null){
            //放在全局变量
            object.reset(data , result);
            //预加载场景
            console.log('ok');
            object.scene("gameMain") ;
        }
    },

    wxlogin: function(event){
        if(tongyi){
            let object = this;
            // var res = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/event/EventManager", "raiseEvent", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", "WXLoginOK","1");
          
            var res = jsb.reflection.callStaticMethod(...object.anMethodParam().wxLogin);
        }else{
            this.alert('请同意用户使用协议');
        }
    },
    login:function(code,target){
        this.loadding();
        cc.weijifen.http.httpGet('/android/appLogin?code='+code+'&gameModel='+cc.weijifen.GameBase.gameModel,target.sucess,target.error,target);
    },
    sucess:function(result,object){
        var data = JSON.parse(result) ;
        if(data != null && data.success == true && data.token!=null){
            object.reset(data,result);  
           /**
            * 登录成功后即创建Socket链接
            */
            console.log('ok:'+data.token);
            object.scene('gameMain') ;
            // }
        } else {
            object.alert(data.msg);
        }
    },
   error:function(object){
       object.closeloadding(object.loaddingDialog);
       object.alert("网络异常，服务访问失败");
   },
   //获取url中的参数
   getUrlParam:function(name) {
       var url = window.location.search.replace("amp;","");
       var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
       var r = url.substr(1).match(reg); //匹配目标参数
       if (r != null) return unescape(r[2]); return null; //返回参数值
    }
});
