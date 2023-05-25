const { Client } = require('@opensearch-project/opensearch')
const { fromEnv } = require("@aws-sdk/credential-providers");
require('dotenv').config({path: '../.env'});

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

client.indices.delete({
    index: process.env.ELASTIC_INDEX_NAME,
})