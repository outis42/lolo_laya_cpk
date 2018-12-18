// cocos runtime平台 SoundManager适配 begin 【添加在原SoundManager的定义之下】
if (loadRuntime()) {

function Channel(url) {
	this.url = url;
	this.audioId;

	this.startTime;
	this.loops;

	this.volume;
	this.audioState;
	this.isStopped;
}

Channel.prototype = {
	constructor : Channel,
	pause : function() {

	},
	resume : function() {

	},
	stop : function() {

	}
}

SoundManager=(function(){

	function SoundManager(){}
	__class(SoundManager,'laya.media.SoundManager');

	// 这个属性似乎没有使用，因为SoundManager._musicClass没有被使用
	__getset(1,SoundManager,'useAudioMusic',function(){
		return SoundManager._useAudioMusic;
		},function(value){
		SoundManager._useAudioMusic=value;
		if (value){
			SoundManager._musicClass=AudioSound;
			}else{
			SoundManager._musicClass=null;
		}
	});

	/**
	*失去焦点后是否自动停止背景音乐。
	*@param v Boolean 失去焦点后是否自动停止背景音乐。
	*
	*/
	/**
	*失去焦点后是否自动停止背景音乐。
	*/
	__getset(1,SoundManager,'autoStopMusic',function(){
		return SoundManager._autoStopMusic;
		},function(v){
		Laya.stage.off(/*laya.events.Event.BLUR*/"blur",null,SoundManager._stageOnBlur);
		Laya.stage.off(/*laya.events.Event.FOCUS*/"focus",null,SoundManager._stageOnFocus);
		Laya.stage.off(/*laya.events.Event.VISIBILITY_CHANGE*/"visibilitychange",null,SoundManager._visibilityChange);
		SoundManager._autoStopMusic=v;
		if (v){
			Laya.stage.on(/*laya.events.Event.BLUR*/"blur",null,SoundManager._stageOnBlur);
			Laya.stage.on(/*laya.events.Event.FOCUS*/"focus",null,SoundManager._stageOnFocus);
			Laya.stage.on(/*laya.events.Event.VISIBILITY_CHANGE*/"visibilitychange",null,SoundManager._visibilityChange);
		}
	});

	/**
	*背景音乐和所有音效是否静音。
	*/
	__getset(1,SoundManager,'muted',function(){
		return SoundManager._muted;
		},function(value){
		if (value==SoundManager._muted)return;
		if (value){
			SoundManager.stopAllSound();
		}
		SoundManager.musicMuted=value;
		SoundManager._muted=value;
	});

	/**
	*背景音乐（不包括音效）是否静音。
	*/
	__getset(1,SoundManager,'musicMuted',function(){
		return SoundManager._musicMuted;
		},function(value){
		if (value==SoundManager._musicMuted)return;
		if (value){
			if (SoundManager._tMusic && SoundManager._musicChannel){
				if (loadRuntime().AudioEngine.getState(SoundManager._musicChannel == loadRuntime().AudioEngine.AudioState.PLAYING)){
					loadRuntime().AudioEngine.pause(SoundManager._musicChannel);
				}else{
					SoundManager._musicChannel=null;
				}
			}else{
				SoundManager._musicChannel=null;
			}
			SoundManager._musicMuted=value;
		}else {
			SoundManager._musicMuted=value;
			if (SoundManager._tMusic){
				if (SoundManager._musicChannel){
					loadRuntime().AudioEngine.resume(SoundManager._musicChannel);
				}
			}
		}
	});

	/**
	*所有音效（不包括背景音乐）是否静音。
	*/
	__getset(1,SoundManager,'soundMuted',function(){
		return SoundManager._soundMuted;
		},function(value){
		SoundManager._soundMuted=value;
	});

    // 原本的channel代表一个可以播放的声音对象，现在的channel只是一个audioId
	SoundManager.addChannel=function(channel){
		if (SoundManager._channels.indexOf(channel)>=0)return;
		SoundManager._channels.push(channel);
	}

	SoundManager.removeChannel=function(channel){
		var i=0;
		for (i=SoundManager._channels.length-1;i >=0;i--){
			if (SoundManager._channels[i]==channel){
				SoundManager._channels.splice(i,1);
			}
		}
	}

    // 用于清理不再使用的声音资源
	SoundManager.disposeSoundIfNotUsed=function(url){
		if (SoundManager._url2channel.has(url)) {
			var channel = SoundManager._url2channel.get(url);
			for (i=SoundManager._channels.length-1;i >=0;i--){
				if (SoundManager._channels[i]==channel){
					return;
				}
			}
		}
		SoundManager.destroySound(url);
	}

	SoundManager._visibilityChange=function(){
		if (Laya.stage.isVisibility){
			SoundManager._stageOnFocus();
			}else {
			SoundManager._stageOnBlur();
		}
	}

	SoundManager._stageOnBlur=function(){
		SoundManager._isActive=false;
		if (SoundManager._musicChannel){
            var musicState = loadRuntime().AudioEngine.getState(SoundManager._musicChannel);
            if (musicState == loadRuntime().AudioEngine.AudioState.PLAYING) {
            	SoundManager._blurPaused=true;
            	loadRuntime().AudioEngine.pause(SoundManager._musicChannel);
            }
		}
		SoundManager.stopAllSound();
		Laya.stage.once(/*laya.events.Event.MOUSE_DOWN*/"mousedown",null,SoundManager._stageOnFocus);
	}

	SoundManager._stageOnFocus=function(){
		SoundManager._isActive=true;
		Laya.stage.off(/*laya.events.Event.MOUSE_DOWN*/"mousedown",null,SoundManager._stageOnFocus);
		if (SoundManager._blurPaused){
			if (SoundManager._musicChannel){
				var musicState = loadRuntime().AudioEngine.getState(SoundManager._musicChannel);
				if (musicState == loadRuntime().AudioEngine.AudioState.PAUSED) {
					loadRuntime().AudioEngine.resume(SoundManager._musicChannel);
				}
			}
			SoundManager._blurPaused=false;
		}
	}

    //soundClass 不再需要，使用loadRuntime().AudioEngine创建播放声音
	SoundManager.playSound=function(url,loops,complete,soundClass,startTime){
		(loops===void 0)&& (loops=1);
		(startTime===void 0)&& (startTime=0);
		if (!SoundManager._isActive || !url)return null;
		if (SoundManager._muted)return null;
		
		url=URL.formatURL(url);
		if (url==SoundManager._tMusic){
			if (SoundManager._musicMuted)return null;
		}else {
			if (SoundManager._soundMuted)return null;
		};
		
		// 还未实现指定次数的循环播放功能
		var channel;
		var volume=(url==SoundManager._tMusic)? SoundManager.musicVolume :SoundManager.soundVolume;
		if (url.startsWith('file://')) {
			url = url.substr('file://'.length);
		}
		channel=loadRuntime().AudioEngine.play(url, loops, volume);
		var success = loadRuntime().AudioEngine.setCurrentTime(channel, startTime);
		if (!success) {

		}
		if (!channel)return null;
		if (complete) {
			loadRuntime().AudioEngine.setFinishCallback(channel, complete);
		}
		
        SoundManager._url2channel.set(url, channel);

		return channel;
	}

	SoundManager.destroySound=function(url){
		//此处应该相当于SoundManager.stopSound，并且回收相关资源。
		SoundManager.stopSound(url);
	}

	SoundManager.playMusic=function(url,loops,complete,startTime){
		(loops===void 0)&& (loops=0);
		(startTime===void 0)&& (startTime=0);
		url=URL.formatURL(url);
		SoundManager._tMusic=url;
		if (SoundManager._musicChannel) {
			loadRuntime().AudioEngine.stop(SoundManager._musicChannel);
		}
		SoundManager._musicChannel = SoundManager.playSound(url,loops,complete,loops,startTime);

		return SoundManager._musicChannel;
	}

	SoundManager.stopSound=function(url){
		url=URL.formatURL(url);

		if (SoundManager._url2channel.has(url)) {
			var channel = SoundManager._url2channel.get(url);
			loadRuntime().AudioEngine.stop(channel);

			//如果停止的是背景音乐的处理
			if (SoundManager._tMusic == url) {
				SoundManager._tMusic = null;
				SoundManager._musicChannel = null;
			}

			SoundManager._url2channel.delete(url);
		}
	}

	SoundManager.stopAll=function(){
		SoundManager._tMusic = null;
		SoundManager._musicChannel = null;
        SoundManager._url2channel.clear();

		loadRuntime().AudioEngine.stopAll();
	}


	SoundManager.stopAllSound=function(){
		var i=0;
		var channel;
		for (i=SoundManager._channels.length-1;i >=0;i--){
			channel=SoundManager._channels[i];
			if (channel !=SoundManager._musicChannel){
				loadRuntime().AudioEngine.stop(channel);
			}
		}
	}

	SoundManager.stopMusic=function(){
		if (SoundManager._musicChannel){
            loadRuntime().AudioEngine.stop(SoundManager._musicChannel);
		}
		SoundManager._tMusic = null;
		SoundManager._musicChannel = null;
	}

	SoundManager.setSoundVolume=function(volume,url){
		if (url){
			url=URL.formatURL(url);
			SoundManager._setVolume(url,volume);
		}else {
			SoundManager.soundVolume=volume;
			var i=0;
			var channel;
			for (i=SoundManager._channels.length-1;i >=0;i--){
				channel=SoundManager._channels[i];
				if (channel !=SoundManager._musicChannel){
					loadRuntime().AudioEngine.setVolume(channel, volume);
				}
			}
		}
	}

	SoundManager.setMusicVolume=function(volume){
		SoundManager.musicVolume=volume;
		if (SoundManager._musicChannel) {
			SoundManager._setVolume(SoundManager._tMusic,volume);
		}
	}

	SoundManager._setVolume=function(url,volume){
		if (SoundManager._url2channel.has(url)) {
			var channel = SoundManager._url2channel.get(url);
			loadRuntime().AudioEngine.setVolume(channel, volume);
		}
	}

	SoundManager._url2channel = new Map();

	SoundManager.musicVolume=1;
	SoundManager.soundVolume=1;
	SoundManager.playbackRate=1;
	SoundManager._useAudioMusic=true;
	SoundManager._muted=false;
	SoundManager._soundMuted=false;
	SoundManager._musicMuted=false;
	SoundManager._tMusic=null;
	SoundManager._musicChannel=null;
	SoundManager._channels=[];
	SoundManager._autoStopMusic=false;
	SoundManager._blurPaused=false;
	SoundManager._isActive=true;
	SoundManager._soundClass=null;
	SoundManager._musicClass=null;
	SoundManager.autoReleaseSound=true;
	return SoundManager;
})()


} // cocos runtime平台 SoundManager适配 end