'use strict';

/**
 * 判断参数是否是对象
 *
 * 注：不能通过typeof，因为[]也会判断成object。正常情况应该调用Object.prototype.toString方法来进行判断
 */
function isObject(obj) {
  return Object.prototype.toString.call(obj) === `[object Object]`;
}

module.exports = {
  isObject,
};
