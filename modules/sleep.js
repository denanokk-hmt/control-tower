'use strict';

const conf = require(`../config/configure`);
const express_res = conf.express_res

/**
 * Sleep
 * @param {*} 
 * @param {*}  
 */
const sleep = async (res, waitSec, intervalMSec) => {
  try {
    return sleepInterval(waitSec, intervalMSec, function () {
      const msg = `time left ${waitSec} sec.`
      console.log(msg);
      express_res.func(res, msg)
    });
  } catch(err) {
    throw err
  }
};
module.exports = { sleep };

// setInterval
function sleepInterval(waitSec, intervalMSec=1000, callbackFunc) {
 
  // 経過時間（秒）
  var spanedSec = 0;

  // Freq 1 sec exec
  var id = setInterval(function () {
      spanedSec++;
      if (spanedSec >= waitSec) {// 経過時間 >= 待機時間の場合、待機終了。
          clearInterval(id);// タイマー停止
          if (callbackFunc) callbackFunc();// 完了時、コールバック関数を実行
      } else {
        console.log(`Interval past: ${spanedSec} sec`)
      }
  }, intervalMSec);
}