'use strict';

/**
 * A set of functions called "actions" for `items`
 */

module.exports = {
  list: async (ctx, next) => {
    try {
      ctx.body = JSON.stringify(["aaa"]);
    } catch (err) {
      ctx.body = err
    }
  },
  get: async (ctx, next) => {
    try {
      const id = ctx.params.id;
      ctx.body = JSON.stringify({"ccc": id});
    } catch (err) {
      ctx.body = err;
    }
  },
  // exampleAction: async (ctx, next) => {
  //   try {
  //     ctx.body = 'ok';
  //   } catch (err) {
  //     ctx.body = err;
  //   }
  // }
};
