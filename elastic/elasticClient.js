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

async function searchData(query) {
    // console.log({query, ctx})
    const searchTerm = query.keyword

    console.log({query})

    const limit = /*query["page[limit]"]*/ query?.page?.limit || 20
    const offset = /*query["page[offset]"]*/ query?.page?.offset || 0

    try {
        const esQuery = {
            bool: {
                "must": [],
                "should": [],
            }
        }

        if(searchTerm) {
            esQuery.bool = {
                "should": [
                    {
                        "match_phrase": {
                            "label": {
                                "query": searchTerm,
                            }
                        }
                    }
                    /*
                    {
                        "match": {
                            "content": searchTerm
                        }
                    },
                    {
                        "match": {
                            "title": searchTerm
                        }
                    },
                    {
                        "match": {
                            "description": searchTerm
                        }
                    }*/
                ]
            }
        }

        if(query.filter) {
            const filters = query.filter
            for(const key in filters) {
                esQuery.bool.must.push({
                    "term": {
                        [`${key}.keyword`]: filters[key]
                    }
                })
            }
            /*
            query.bool.must.push({
                "term": {
                    "ne_class.keyword": query.filter
                }
            })
            */
        }

        console.log(esQuery.bool.must)

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
            }
        }

        // console.log({body})

        if(searchTerm || true) {
            body.query = esQuery
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