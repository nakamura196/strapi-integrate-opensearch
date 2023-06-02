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
          dt.id = dt.slug;
          return dt
        })

        var data = specificFields;


        var UserSerializer = new JSONAPISerializer('users', {
          attributes: ['label', 'description', "ne_class", "image", "source", "manifest", "target"]
        });

        var users = UserSerializer.serialize(data);

        const facets = []

        for (const key in resp.aggregations) {
          const facet = resp.aggregations[key];
          const buckets = facet.buckets;
          const facetValues = buckets.map((bucket) => {
            return {
              values: {
                "id": bucket.key,
                "label": bucket.key,
                "count": bucket.doc_count
              }
            }
          })
          facets.push({ "id": key, "label": key, "terms": facetValues })
        }

        ctx.body = {
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
            "facets": facets // resp.aggregations
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