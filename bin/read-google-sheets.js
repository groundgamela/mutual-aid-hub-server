#!/usr/bin/env node

const readline = require('readline');
const googleAuth = require('google-auth-library');
const isEmpty = require('lodash').isEmpty;
const isEqual = require('lodash').isEqual;

const FieldValue = require('firebase-admin').firestore.FieldValue;
const {
  firestore
} = require('../lib/setupFirebase');
const googleMethods = require('../lib/google-methods');

const testing = process.env.NODE_ENV !== 'production';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Mutual Aid Networks [LIVE DATA TO WEBSITE]";

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

function checkForChanges(dbObject, newData) {
  return Object.keys(newData).reduce((acc, key) => {
    if (newData[key] && !isEqual(newData[key], dbObject[key])) {
      acc[key] = newData[key];
    }
    if (!newData[key] && dbObject[key]) {
      let emptyValue = MutualAidNetwork.getEmptyValue(key);
      if (emptyValue === -1) {
        let docRef = firestore.collection('mutual_aid_networks').doc(dbObject.id);
        // removing field that shouldn't be there
        docRef.update({
          [key]: FieldValue.delete()
        }).then(() => console.log('removed field', key))
          .catch(console.log);
      } else  {
        acc[key] = emptyValue;
      }
    }
    return acc;
  }, {});
}

function convertOneObject(object) {
  let newMutualAidNetwork = new MutualAidNetwork(object);
  if (newMutualAidNetwork.country !== 'USA' && newMutualAidNetwork.country !== 'Canada') {
    return;
  }


  newMutualAidNetwork.checkIfExists().then((exists) => {
    if (exists) {
      exists.forEach((dbNetwork) => {
        const newValues = checkForChanges(dbNetwork, newMutualAidNetwork);
        if (!isEmpty(newValues)) {
          if (!newValues.city && !newValues.state && !newValues.zipCode) {
            console.log('new values', newValues, dbNetwork.title);
            return firestore.collection('mutual_aid_networks').doc(dbNetwork.id).update(newValues).catch(console.log);
          } else {
            exists = false;
            console.log('needs to be re-geocoded', dbNetwork.title, newValues, dbNetwork.city, dbNetwork.state)
            firestore.collection('mutual_aid_networks').doc(dbNetwork.id).delete().catch(console.log);
          }
        }
      })
    }
    if (exists) {
      return;
    }
    console.log('adding new', newMutualAidNetwork.title)
    // geocode street address
    if (newMutualAidNetwork.state) {
      newMutualAidNetwork.getLatandLog()
        .then(() => {
          if (newMutualAidNetwork.lat) {
            const databaseNetwork = newMutualAidNetwork.createDatabaseObject();
            const valid = validate.mutualAidNetwork(databaseNetwork);
            if (valid) {
              // R, S, T, U
              // id,	validated, 	formatted_address, 	last_updated
              if (true) {
                firestore.collection("mutual_aid_networks").add(databaseNetwork)
                  .catch(function (error) {
                    console.error("Error adding document: ", error);
                  });
              }
            } else {
              console.log('failed', validate.mutualAidNetwork.errors[0]);
            }
            return;
          } else {
            console.log('no lat', newMutualAidNetwork.title)
          }
        }).catch((e) => console.log(e.message, newMutualAidNetwork.neighborhood, newMutualAidNetwork.city, newMutualAidNetwork.state))

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
    });

    dupNetworks.forEach((net) => {
      convertOneObject(net, rowNumber);
    })
  } else {
    convertOneObject(object, rowNumber)
  }
}

googleMethods.read(oauth2Client, SHEET_ID, `${SHEET_NAME}!A3:Q`)
  .then((googleRows) => {
    googleRows.forEach((row, i) => {
      const thisRowIndex = i + 2;
      processOneRow(thisRowIndex, row)
    });
  })
  .catch(e => {
    console.log('error reading crisis sheet', e)
  });