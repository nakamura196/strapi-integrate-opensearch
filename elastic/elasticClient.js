const { Client } = require('@opensearch-project/opensearch')
const { fromEnv } = require("@aws-sdk/credential-providers");
// const fs = require('fs')
// const path = require('path');
require('dotenv').config();

let client = null;

function initializeESClient() {
    try {
        client = new Client({
            node: process.env.ELASTIC_HOST,
            auth: {
                username: process.env.ELASTIC_USERNAME,
                password: process.env.ELASTIC_PASSWORD
            },
            credentials: fromEnv()
            /*,
            tls: {
                ca: fs.readFileSync(path.join(__dirname, process.env.ELASTIC_CERT_NAME)),
                rejectUnauthorized: false
            }
            */
        });
    }
    catch (err) {
        console.log('Error while initializing the connection to ElasticSearch.')
        console.log(err);
    }
}

async function indexData({ itemId, label, description, slug, ne_class, image, source, manifest, target }) {
    const indexName = process.env.ELASTIC_INDEX_NAME;



    try {
        await client.index({
            index: indexName,
            id: itemId,
            body: {
                slug, label, description, ne_class, image, source, manifest, target
            },
            refresh: true,
        })

        // await client.indices.refresh({ index: indexName });
    }
    catch (err) {
        console.log('Error encountered while indexing data to ElasticSearch.')
        console.log(err);
        throw err;
    }
}

async function removeIndexedData({ itemId }) {
    try {
        await client.delete({
            index: process.env.ELASTIC_INDEX_NAME,
            id: itemId,
            refresh: true,
        });
        // await client.indices.refresh({ index: process.env.ELASTIC_INDEX_NAME });
    }
    catch (err) {
        console.log('Error encountered while removing indexed data from ElasticSearch.')
        // throw err;
    }
}

const createFilters = (query) => {
    const filters = {};

    const conjunctions = {
        "": "AND",
    };

    if(query.filter) {
        const filters2 = query.filter
        for(const key in filters2) {
            const value = filters2[key]
            console.log(value)
            if(value.group) {

                conjunctions[key] = value.group.conjunction

            } else if(value.condition) {
                if(!filters[key]) {
                    filters[key] = {
                        path: value.condition.path,
                        value: value.condition.value,
                        operator: value.condition.operator,
                        memberOf: value.condition.memberOf,
                    }
                }
            } else {

                const name = `${key}.${value}`
                filters[name] = {
                    path: key,
                    value: value,
                    operator: "eq",
                    memberOf: "",
                }
                
            }
        }
    }
    return [filters, conjunctions]
}

const createQuery = (filters, conjunctions) => {
  const members = {};

  for (const key in filters) {
    const filter = filters[key];

    const memberOf = filter.memberOf;

    if (!members[memberOf]) {
      members[memberOf] = [];
    }

    members[memberOf].push(filter);
  }

  const musts = [];

  const esQuery = {
    bool: {
      must: musts,
    },
  };

  for (const conjunction in conjunctions) {
    const filters = members[conjunction];

    if (!filters) {
      continue;
    }

    const clauses = [];

    for (const key in filters) {
      const filter = filters[key];

      const operator = filter.operator;

      if (operator == "CONTAINS") {
        const condition = {
          match_phrase: {
            [filter.path]: {
              query: filter.value,
            },
          },
        };

        clauses.push(condition);
      } else if (operator == "eq") {
        const condition = {
          term: {
            [`${filter.path}`]: filter.value, // .keyword
          },
        };

        clauses.push(condition);
      }
    }

    if (conjunctions[conjunction] === "AND") {
      musts.push({
        bool: {
          must: clauses,
        },
      });
    } else {
      musts.push({
        bool: {
          should: clauses,
        },
      });
    }
  }

  return esQuery;
};

async function searchData(query) {

    const limit = /*query["page[limit]"]*/ query?.page?.limit || 20
    const offset = /*query["page[offset]"]*/ query?.page?.offset || 0

    try {

        const [filters, conjunctions] = createFilters(query)

        const esQuery2 = createQuery(filters, conjunctions)

        const body = {
            size: limit,
            from: offset,
            // query
            "aggs": {
                "ne_class": {
                    "terms": {
                        "field": "ne_class.keyword",
                    }
                },
                "source": {
                    "terms": {
                        "field": "source.keyword",
                    }
                }
            },
            "query": esQuery2,
        }

        const result = await client.search({
            index: process.env.ELASTIC_INDEX_NAME,
            body
        });

        return result.body;
    }
    catch (err) {
        console.log('Search : elasticClient.searchData : Error encountered while making a search request to ElasticSearch.')
        throw err;
    }
}

module.exports = {
    initializeESClient, indexData, removeIndexedData, searchData
}