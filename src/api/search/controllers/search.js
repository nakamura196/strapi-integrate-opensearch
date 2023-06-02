'use strict';

const { searchData } = require('../../../../elastic/elasticClient');

var JSONAPISerializer = require('jsonapi-serializer').Serializer;



module.exports = {
  performSearch: async (ctx, next) => {
    try {


      const resp = await searchData(ctx.query);
      if (resp?.hits?.hits) {
        const specificFields = /*filteredMatches*/resp.hits.hits.map((data) => {
          const dt = data['_source'];
          // return { title: dt.title, slug: dt.slug, description: dt.description }
          dt.id = dt.slug;
          return dt
        })

        var data = /*[
          { id: 1, firstName: 'Sandro', lastName: 'Munda' },
          { id: 2, firstName: 'John', lastName: 'Doe' }
        ]*/ specificFields;

        var UserSerializer = new JSONAPISerializer('users', {
          attributes: ['label', 'description', "ne_class", "image", "source", "manifest", "target"]
        });
        
        var users = UserSerializer.serialize(data);

        ctx.body = {
          // "total": resp.hits.total.value,
          // "hits": specificFields, //resp.hits.hits,
          // "aggregations": resp.aggregations,
          // specificFields,
          "jsonapi": {
            "version": "1.0",
            "meta": {
              "links": {
                "self": {
                  "href": "http://jsonapi.org/format/1.0/"
                }
              }
            }
          },
          "data": users.data,
          "meta": {
            "count": resp.hits.total.value,
            "facets": resp.aggregations
          }
        } // resp //specificFields;
      }
      else
        ctx.body = {}

    } catch (err) {
      ctx.response.status = 500;
      ctx.body = "An error was encountered while processing the search request."
      console.log('An error was encountered while processing the search request.')
      console.log(err);
    }
  }
};