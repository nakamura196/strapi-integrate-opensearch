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

async function indexData({ itemId, title, description, content, slug }) {
    const indexName = process.env.ELASTIC_INDEX_NAME;



    try {
        await client.index({
            index: indexName,
            id: itemId,
            body: {
                slug, title, description, content
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

async function searchData(searchTerm) {
    try {
        const query = {}

        if(searchTerm) {
            query.bool = {
                "should": [
                    {
                        "match_phrase": {
                            "title": {
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

        const body = {
            size: 100,
            // query
            "aggs": {
                "description": {
                    "terms": {
                        "field": "description.keyword",
                    }
                }
            }
        }

        if(searchTerm) {
            body.query = query
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