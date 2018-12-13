CanvasRenderingContext2D.prototype.drawImage = f = function (image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {

}

jsb.fileUtils = {};
jsb.fileUtils.getStringFromFile = function (url) {
return loadRuntime().getFileSystemManager().readFileSync(url, "utf8");
}
jsb.fileUtils.getDataFromFile = function (url) {
return loadRuntime().getFileSystemManager().readFileSync(url);
}

var oldCreateElement = document.createElement;
	document.createElement = function (name) {
	if (name === "canvas") {
		return window.__canvas;
	}
	return oldCreateElement(name);
}
//路径可自定义
require("code.js");