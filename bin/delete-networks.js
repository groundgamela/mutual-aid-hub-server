#!/usr/bin/env node

const readline = require('readline');
const googleAuth = require('google-auth-library');
const isEmpty = require('lodash').isEmpty;
const {
    firestore
} = require('../lib/setupFirebase');
const googleMethods = require('../lib/google-methods');

const testing = process.env.NODE_ENV !== 'production';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

var clientSecret = process.env.GOOGLE_CLIENT_SECRET;
var clientId = process.env.GOOGLE_CLIENT_ID;
var redirectUrl = process.env.GOOGLE_REDIRECT_URI_1;
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

const MutualAidNetwork = require('../network');

const currentToken = {
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    token_type: 'Bearer',
    expiry_date: 1522106489761,
};

oauth2Client.credentials = currentToken;

function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            console.log('got token', token);
            oauth2Client.credentials = token;
            callback(oauth2Client);
        });
    });
}


function checkIfExists(title) {
    return firestore.collection("mutual_aid_networks").where("title", "==", title)
        .get()
        .then(function (querySnapshot) {
            if (!querySnapshot.empty) {
                let networks = [];
                querySnapshot.forEach(ele => {
                    network = {
                        ...ele.data(),
                        id: ele.id
                    };
                    networks.push(network);
                })
                return networks;
            } else {
                return false;
            }
        })
        .catch(function (error) {
            console.log("Error getting documents: ", error);
        });

}


function processOneRow(rowNumber, rowData) {
    // no data
    if (!rowData[0]) {
        return;
    }
    let object = MutualAidNetwork.makeEventFromSpreadSheet(rowData);
    checkIfExists(object.title).then((exists) => {
        if (exists && exists.length) {
            exists.forEach((doc) => {
                firestore.collection('mutual_aid_networks').doc(doc.id).delete()
                    .then(() => console.log('deleted network', doc.title));
            })
        }
    })

}

googleMethods.read(oauth2Client, SHEET_ID, 'Deleted Entries!A3:M')
    .then((googleRows) => {
        googleRows.forEach((row, i) => {
            const thisRowIndex = i + 2;
            processOneRow(thisRowIndex, row)
        });
    })
    .catch(e => {
        console.log('error reading crisis sheet', e)
    });
