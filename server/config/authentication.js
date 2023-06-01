const {google} = require('googleapis');

// path to service account jsonfile
//TODO: it is asking absolute path. Is it possible to give the relative path?
const keyPath = '/Pretty Petty Project/server/config/service_account_credentials.json';
// require cannot be used above as it returns an object and the string

// Scopes required for the API you want to use
const scopes = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/spreadsheets'];

async function main(){
    // Load service account credentials
    const auth = new google.auth.GoogleAuth({
        keyFile : keyPath,
        scopes: scopes
    });

    // Create a client instance for the API you want to use
    const client = await auth.getClient();
    console.log('Service account authentication successful');
    return client
}

module.exports = main;