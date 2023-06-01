module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/items',
      handler: 'items.list',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/items/:id',
      handler: 'items.get',
      config: {
        policies: [],
        middlewares: [],
      },
    }
    // {
    //  method: 'GET',
    //  path: '/items',
    //  handler: 'items.exampleAction',
    //  config: {
    //    policies: [],
    //    middlewares: [],
    //  },
    // },
  ],
};
