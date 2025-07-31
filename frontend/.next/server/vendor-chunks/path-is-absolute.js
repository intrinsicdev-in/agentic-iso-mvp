"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/path-is-absolute";
exports.ids = ["vendor-chunks/path-is-absolute"];
exports.modules = {

/***/ "(ssr)/../node_modules/path-is-absolute/index.js":
/*!*************************************************!*\
  !*** ../node_modules/path-is-absolute/index.js ***!
  \*************************************************/
/***/ ((module) => {

eval("\nfunction posix(path) {\n    return path.charAt(0) === \"/\";\n}\nfunction win32(path) {\n    // https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56\n    var splitDeviceRe = /^([a-zA-Z]:|[\\\\\\/]{2}[^\\\\\\/]+[\\\\\\/]+[^\\\\\\/]+)?([\\\\\\/])?([\\s\\S]*?)$/;\n    var result = splitDeviceRe.exec(path);\n    var device = result[1] || \"\";\n    var isUnc = Boolean(device && device.charAt(1) !== \":\");\n    // UNC paths are always absolute\n    return Boolean(result[2] || isUnc);\n}\nmodule.exports = process.platform === \"win32\" ? win32 : posix;\nmodule.exports.posix = posix;\nmodule.exports.win32 = win32;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzL3BhdGgtaXMtYWJzb2x1dGUvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFFQSxTQUFTQSxNQUFNQyxJQUFJO0lBQ2xCLE9BQU9BLEtBQUtDLE1BQU0sQ0FBQyxPQUFPO0FBQzNCO0FBRUEsU0FBU0MsTUFBTUYsSUFBSTtJQUNsQiwrRkFBK0Y7SUFDL0YsSUFBSUcsZ0JBQWdCO0lBQ3BCLElBQUlDLFNBQVNELGNBQWNFLElBQUksQ0FBQ0w7SUFDaEMsSUFBSU0sU0FBU0YsTUFBTSxDQUFDLEVBQUUsSUFBSTtJQUMxQixJQUFJRyxRQUFRQyxRQUFRRixVQUFVQSxPQUFPTCxNQUFNLENBQUMsT0FBTztJQUVuRCxnQ0FBZ0M7SUFDaEMsT0FBT08sUUFBUUosTUFBTSxDQUFDLEVBQUUsSUFBSUc7QUFDN0I7QUFFQUUsT0FBT0MsT0FBTyxHQUFHQyxRQUFRQyxRQUFRLEtBQUssVUFBVVYsUUFBUUg7QUFDeERVLG9CQUFvQixHQUFHVjtBQUN2QlUsb0JBQW9CLEdBQUdQIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZXRzLWFlcm8taXNvLWZyb250ZW5kLy4uL25vZGVfbW9kdWxlcy9wYXRoLWlzLWFic29sdXRlL2luZGV4LmpzPzA3MmUiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBwb3NpeChwYXRoKSB7XG5cdHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufVxuXG5mdW5jdGlvbiB3aW4zMihwYXRoKSB7XG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL2IzZmNjMjQ1ZmIyNTUzOTkwOWVmMWQ1ZWFhMDFkYmY5MmUxNjg2MzMvbGliL3BhdGguanMjTDU2XG5cdHZhciBzcGxpdERldmljZVJlID0gL14oW2EtekEtWl06fFtcXFxcXFwvXXsyfVteXFxcXFxcL10rW1xcXFxcXC9dK1teXFxcXFxcL10rKT8oW1xcXFxcXC9dKT8oW1xcc1xcU10qPykkLztcblx0dmFyIHJlc3VsdCA9IHNwbGl0RGV2aWNlUmUuZXhlYyhwYXRoKTtcblx0dmFyIGRldmljZSA9IHJlc3VsdFsxXSB8fCAnJztcblx0dmFyIGlzVW5jID0gQm9vbGVhbihkZXZpY2UgJiYgZGV2aWNlLmNoYXJBdCgxKSAhPT0gJzonKTtcblxuXHQvLyBVTkMgcGF0aHMgYXJlIGFsd2F5cyBhYnNvbHV0ZVxuXHRyZXR1cm4gQm9vbGVhbihyZXN1bHRbMl0gfHwgaXNVbmMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgPyB3aW4zMiA6IHBvc2l4O1xubW9kdWxlLmV4cG9ydHMucG9zaXggPSBwb3NpeDtcbm1vZHVsZS5leHBvcnRzLndpbjMyID0gd2luMzI7XG4iXSwibmFtZXMiOlsicG9zaXgiLCJwYXRoIiwiY2hhckF0Iiwid2luMzIiLCJzcGxpdERldmljZVJlIiwicmVzdWx0IiwiZXhlYyIsImRldmljZSIsImlzVW5jIiwiQm9vbGVhbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJwcm9jZXNzIiwicGxhdGZvcm0iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/path-is-absolute/index.js\n");

/***/ })

};
;