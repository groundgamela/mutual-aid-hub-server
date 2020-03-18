#!/usr/bin/env node

const readline = require('readline');
const googleAuth = require('google-auth-library');
const moment = require('moment');
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

const validate = require('../lib/schema');
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

function writeToGoogle(googleSheetsRange, data) {
  const toWrite = {
    'range': googleSheetsRange,
    'majorDimension': 'ROWS',
    'values': [
      data,
    ],
  };
  if (testing) {
    return Promise.resolve();
  }
  return googleMethods.write(oauth2Client, SHEET_ID, [toWrite]);
}

function checkIfExists(title) {
  return firestore.collection("mutual_aid_networks").where("title", "==", title)
    .get()
    .then(function (querySnapshot) {
      if (!querySnapshot.empty) {
        return true;
      } else {
        return false;
      }
    })
    .catch(function (error) {
      console.log("Error getting documents: ", error);
    });

}

function convertOneObject(object, rowNumber) {
  const googleSheetsRange = `North American Mutual Aid Networks!N${rowNumber}:Q${rowNumber}`
  let googleSheetData;
  let mutualAid = new MutualAidNetwork(object);
  if (mutualAid.country !== 'USA') {
    return
  }


  checkIfExists(object.title).then((exists) => {
    if (exists) {
      return;
    }

    // geocode street address
    if (mutualAid.state) {
      mutualAid.getLatandLog()
        .then(() => {
          if (mutualAid.lat) {
            const databaseEvent = mutualAid.createDatabaseObject();
            const valid = validate.mutualAidNetwork(databaseEvent);
            if (valid) {
              // R, S, T, U
              // id,	validated, 	formatted_address, 	last_updated
              if (true) {
                firestore.collection("mutual_aid_networks").add(databaseEvent)
                  .then(function (docRef) {
                    googleSheetData = [docRef.id, true, databaseEvent.address, ''];
                  })
                  .catch(function (error) {
                    console.error("Error adding document: ", error);
                  });
              }
            } else {
              console.log('failed');
              googleSheetData = ['', validate.mutualAidNetwork.errors[0].dataPath, databaseEvent.address, ''];
            }
            return writeToGoogle(googleSheetsRange, googleSheetData)
          } else {
            console.log('no lat', databaseEvent.title)
          }
        }).catch((e) => console.log(e.message, mutualAid.neighborhood, mutualAid.city, mutualAid.state))

    } else {
      console.log('no state')
    }
  })
}

function processOneRow(rowNumber, rowData) {


  // no data
  if (!rowData[0]) {
    return;
  }
  let object = MutualAidNetwork.makeEventFromSpreadSheet(rowData);
  const cities = object.city ? object.city.split('/') : [];
  if (cities.length > 1) {
    let dupNetworks = cities.map((ele) => {
      return {
        ...object,
        city: ele,
      }
    })
    dupNetworks.forEach((network) => convertOneObject(network, rowNumber))
  } else {
    convertOneObject(object, rowNumber)
  }
}

googleMethods.read(oauth2Client, SHEET_ID, 'North American Mutual Aid Networks!A3:M')
  .then((googleRows) => {
    googleRows.forEach((row, i) => {
      const thisRowIndex = i + 2;
      processOneRow(thisRowIndex, row)
    });
  })
  .catch(e => {
    console.log('error reading crisis sheet', e)
  });