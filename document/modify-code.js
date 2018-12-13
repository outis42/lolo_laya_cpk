//（1）加载本地资源
URL.formatURL = function (url, base) {
	if (!url) return "null path";
	if (url.indexOf(":") > 0) return url;
	if (URL.customFormat != null) url = URL.customFormat(url, base);
	var char1 = url.charAt(0);
	if (char1 === ".") {
		return URL.formatRelativePath((base || URL.basePath) + url);
	} else if (char1 === '~') {
		return URL.rootPath + url.substring(1);
	} else if (char1 === "d") {
		if (url.indexOf("data:image") === 0) return url;
	} else if (char1 === "/") {
		return url;
	}
	if (window.jsb) {
		return (base || URL.basePath) + url;
	} else {
		return (base || "file://") + url;
	}
}

//（2）读取文件方式修改
__proto.load = function (url, type, cache, group, ignoreCache) {
	(cache === void 0) && (cache = true);
	(ignoreCache === void 0) && (ignoreCache = false);
	this._url = url;
	if (url.indexOf("data:image") === 0) this._type = type = "image";
	else {
		this._type = type || (type = this.getTypeFromUrl(url));
		url = URL.formatURL(url);
	}
	this._cache = cache;
	this._data = null;
	if (!ignoreCache && Loader.loadedMap[url]) {
		this._data = Loader.loadedMap[url];
		this.event(/*laya.events.Event.PROGRESS*/"progress", 1);
		this.event(/*laya.events.Event.COMPLETE*/"complete", this._data);
		return;
	}
	if (group) Loader.setGroup(url, group);
	if (Loader.parserMap[type] != null) {
		this._customParse = true;
		if (((Loader.parserMap[type]) instanceof laya.utils.Handler)) Loader.parserMap[type].runWith(this);
		else Loader.parserMap[type].call(null, this);
		return;
	}
	if (type === "image" || type === "htmlimage" || type === "nativeimage") return this._loadImage(url);
	if (type === "sound") return this._loadSound(url);
	if (type === "ttf") return this._loadTTF(url);
	if (type == "atlas") {
		if (Loader.preLoadedAtlasConfigMap[url]) {
			this.onLoaded(Loader.preLoadedAtlasConfigMap[url]);
			delete Loader.preLoadedAtlasConfigMap[url];
			return;
		}
	}
	if (window.jsb) {
		setTimeout(() => {
			if (url.startsWith('file://'))
				url = url.substr('file://'.length);
			var response;
			if (type == 'pkm' || type == 'arraybuffer') {
				response = jsb.fileUtils.getDataFromFile(url);
			}
			else {
				response = jsb.fileUtils.getStringFromFile(url);
				if (type == 'atlas' || type == 'json') {
					response = JSON.parse(response);
				}
			}

			this.onLoaded(response);

		}, 0);
	}
	else {
		if (!this._http) {
			this._http = new HttpRequest();
			this._http.on(/*laya.events.Event.PROGRESS*/"progress", this, this.onProgress);
			this._http.on(/*laya.events.Event.ERROR*/"error", this, this.onError);
			this._http.on(/*laya.events.Event.COMPLETE*/"complete", this, this.onLoaded);
		};
		var contentType;
		switch (type) {
			case "atlas":
				contentType = "json";
				break;
			case "font":
				contentType = "xml";
				break;
			case "pkm":
				contentType = "arraybuffer";
				break
			default:
				contentType = type;
		}
		this._http.send(url, null, "get", contentType);
	}
}
