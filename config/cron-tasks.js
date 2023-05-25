const { performIndexingForSearch } = require('../elastic/cron-search-indexing');
  
 module.exports = {
    performIndexingForSearch: {
      task: async({strapi}) => {
        return await performIndexingForSearch({strapi});
      },
      options: {
        rule: "*/1 * * * *" //run daily at 11:00 PM
      },
    }
}