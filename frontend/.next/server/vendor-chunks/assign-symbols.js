"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/assign-symbols";
exports.ids = ["vendor-chunks/assign-symbols"];
exports.modules = {

/***/ "(ssr)/./node_modules/assign-symbols/index.js":
/*!**********************************************!*\
  !*** ./node_modules/assign-symbols/index.js ***!
  \**********************************************/
/***/ ((module) => {

eval("/*!\n * assign-symbols <https://github.com/jonschlinkert/assign-symbols>\n *\n * Copyright (c) 2015, Jon Schlinkert.\n * Licensed under the MIT License.\n */\n\n\n\nmodule.exports = function(receiver, objects) {\n  if (receiver === null || typeof receiver === 'undefined') {\n    throw new TypeError('expected first argument to be an object.');\n  }\n\n  if (typeof objects === 'undefined' || typeof Symbol === 'undefined') {\n    return receiver;\n  }\n\n  if (typeof Object.getOwnPropertySymbols !== 'function') {\n    return receiver;\n  }\n\n  var isEnumerable = Object.prototype.propertyIsEnumerable;\n  var target = Object(receiver);\n  var len = arguments.length, i = 0;\n\n  while (++i < len) {\n    var provider = Object(arguments[i]);\n    var names = Object.getOwnPropertySymbols(provider);\n\n    for (var j = 0; j < names.length; j++) {\n      var key = names[j];\n\n      if (isEnumerable.call(provider, key)) {\n        target[key] = provider[key];\n      }\n    }\n  }\n  return target;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYXNzaWduLXN5bWJvbHMvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVhOztBQUViO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0Isa0JBQWtCO0FBQ3RDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyIvVXNlcnMvaXRlb2x1d2FraXNpYmVsbG8vRG9jdW1lbnRzL2luZ3Jlc3MvZnJvbnRlbmQvbm9kZV9tb2R1bGVzL2Fzc2lnbi1zeW1ib2xzL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogYXNzaWduLXN5bWJvbHMgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L2Fzc2lnbi1zeW1ib2xzPlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSwgSm9uIFNjaGxpbmtlcnQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHJlY2VpdmVyLCBvYmplY3RzKSB7XG4gIGlmIChyZWNlaXZlciA9PT0gbnVsbCB8fCB0eXBlb2YgcmVjZWl2ZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZXhwZWN0ZWQgZmlyc3QgYXJndW1lbnQgdG8gYmUgYW4gb2JqZWN0LicpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmplY3RzID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgU3ltYm9sID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiByZWNlaXZlcjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiByZWNlaXZlcjtcbiAgfVxuXG4gIHZhciBpc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuICB2YXIgdGFyZ2V0ID0gT2JqZWN0KHJlY2VpdmVyKTtcbiAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGkgPSAwO1xuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICB2YXIgcHJvdmlkZXIgPSBPYmplY3QoYXJndW1lbnRzW2ldKTtcbiAgICB2YXIgbmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHByb3ZpZGVyKTtcblxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgbmFtZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIHZhciBrZXkgPSBuYW1lc1tqXTtcblxuICAgICAgaWYgKGlzRW51bWVyYWJsZS5jYWxsKHByb3ZpZGVyLCBrZXkpKSB7XG4gICAgICAgIHRhcmdldFtrZXldID0gcHJvdmlkZXJba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn07XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/assign-symbols/index.js\n");

/***/ })

};
;