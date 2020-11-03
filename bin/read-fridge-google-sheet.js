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
const SHEET_NAME = "Food Resources";
const {
  FOOD_RESOURCE_COLLECTION_NAME
} = require('../constants');

var clientSecret = process.env.GOOGLE_CLIENT_SECRET;
var clientId = process.env.GOOGLE_CLIENT_ID;
var redirectUrl = process.env.GOOGLE_REDIRECT_URI_1;
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

const validate = require('../food-resource/schema');
const FoodResource = require('../food-resource');

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
    if (!FoodResource.isInSchema(key)) {
      return acc;
    }
    if (key === "address") {
      return acc;
    }
    if (newData[key] && !isEqual(newData[key], dbObject[key])) {
      acc[key] = newData[key];
    } else if (!newData[key] && dbObject[key]) {
      let emptyValue = FoodResource.getEmptyValue(key);
      if (emptyValue === -1) {
        let docRef = firestore.collection(FOOD_RESOURCE_COLLECTION_NAME).doc(dbObject.id);
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
  let newFoodResource = new FoodResource(object);

  newFoodResource.checkIfExists().then((exists) => {
    if (exists) {
      exists.forEach((dbResource) => {
        if (newFoodResource.delete) {
          return newFoodResource.deleteById(dbResource.id);
        }
        const newValues = checkForChanges(dbResource, newFoodResource);

        if (!isEmpty(newValues)) {
          if (!newValues.city && !newValues.state) {
            console.log('new values', newValues, dbResource.title);
            return firestore.collection(FOOD_RESOURCE_COLLECTION_NAME).doc(dbResource.id).update(newValues).catch(console.log);
          } else {
            exists = false;
            console.log('needs to be re-geocoded', dbResource.title, newValues, dbResource.city, dbResource.state)
            firestore.collection(FOOD_RESOURCE_COLLECTION_NAME).doc(dbResource.id).delete().catch(console.log);
          }
        }
      })
    }
    if (exists) {
      return;
    }
    console.log('adding new', newFoodResource.title)
    // geocode street address
    if (newFoodResource.state) {
      newFoodResource.getLatandLog()
        .then(() => {
          if (newFoodResource.lat) {
            const dbFoodResource = newFoodResource.createDatabaseObject();
            const valid = validate.foodResource(dbFoodResource);
            if (valid) {
              // R, S, T, U
              // id,	validated, 	formatted_address, 	last_updated
              if (true) {
                firestore.collection(FOOD_RESOURCE_COLLECTION_NAME).add(dbFoodResource)
                  .catch(function (error) {
                    console.error("Error adding document: ", error);
                  });
              }
            } else {
              console.log('failed', validate.foodResource.errors[0]);
            }
            return;
          } else {
            console.log('no lat', newFoodResource.title)
          }
        }).catch((e) => console.log(e.message, newFoodResource.city, newFoodResource.state))

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
  let object = FoodResource.makeEventFromSpreadSheet(rowData); 
  convertOneObject(object, rowNumber)
  
}

googleMethods.read(oauth2Client, SHEET_ID, `${SHEET_NAME}!A3:R`)
  .then((googleRows) => {
    googleRows.forEach((row, i) => {
      const thisRowIndex = i + 2;
      processOneRow(thisRowIndex, row)
    });
  })
  .catch(e => {
    console.log('error reading crisis sheet', e)
  });