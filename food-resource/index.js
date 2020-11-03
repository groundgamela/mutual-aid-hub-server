const request = require('superagent');
const _ = require('lodash');

const moment = require('moment-timezone');
const {
    firestore
} = require('../lib/setupFirebase');
const headers = require('./constants');
const validate = require('./schema');
const stateNames = require('../lib/state-names');
const { FOOD_RESOURCE_COLLECTION_NAME } = require('../constants');

class FoodResource {

    static makeEventFromSpreadSheet(row) {
        const out = {};
        headers.forEach((key, i) => {
            out[key] = row[i]
        })
        return out;
    }

    static isInSchema(key) {
        return !!validate.foodResourceSchema.properties[key];
    }
    static getEmptyValue(key) {
        if (!validate.foodResourceSchema.properties[key]) {
            return -1;
        }
        switch (validate.foodResourceSchema.properties[key].type) {
            case "string":
                return '';
            case "integer":
                return 0;
            case "number":
                return 0;
            case "array":
                return [];
            case "boolean":
                return false;
        }
        
    }

    constructor(obj) {
        this.resources = {};
        for (let key in obj) {
            if (key === "fridge" || key === "freezer" || key === "pantry" || key === "foodBank") {
                this.resources[key] = obj[key] === 'TRUE';
            } else if (obj[key] === "TRUE" || obj[key] === "FALSE") {
                this[key] = obj[key] === "TRUE";
            } else {

                this[key] = obj[key] ? obj[key].trim() : undefined;
            }
        }
        this.category = "Food Resource"

    }

    hasField(field) {
        return this[field] && this[field].length > 0;
    }

    checkIfExists() {
        return firestore.collection(FOOD_RESOURCE_COLLECTION_NAME).where("title", "==", this.title)
            .get()
            .then(function (querySnapshot) {
                if (!querySnapshot.empty) {
                    let networks = [];
                    querySnapshot.forEach(ele => {
                        let network = {
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


    //geocodes an address
    getLatandLog() {
        const requestedState = this.state;
        const requestedCity = this.city;
        const address = `${this.address || ''} ${this.city || ''} ${this.state || ''}`.trim();
        const apiUrl = "https://maps.googleapis.com/maps/api/geocode/json";
        const addressQuery = address.replace(' ', '+');
        const url = `${apiUrl}?key=${process.env.GEOCODE_KEY}`;
        return request
            .get(url)
            .set('Accept', 'application/json')
            .query({
                address: addressQuery,
            })
            .then(returned => {
                const {
                    body
                } = returned;
                if (body.results[0]) {
                    let data = body.results[0];
                    const returnedStateMatched = _.find(data.address_components, {short_name: requestedState});
                    const returnedCityMatched = _.find(data.address_components, {short_name: requestedCity});

                    if (!returnedStateMatched) {
                        console.log('state doesnt match', data.address_components)
                        return;
                    }
                    if (!returnedCityMatched) {
                        console.log('city doesnt match', data.address_components)
                        return;
                    }
                    this.address = data.formatted_address;
                    this.lat = data.geometry.location.lat;
                    this.lng = data.geometry.location.lng;
                    this.bbox = [data.geometry.viewport.southwest.lng, data.geometry.viewport.southwest.lat, 
                        data.geometry.viewport.northeast.lng, data.geometry.viewport.southwest.lat];
                    return this;
                }

            })
    }

    deleteById(id) {
        if (!id) {
            console.log('no id');
            return;
        }
        return firestore.collection(FOOD_RESOURCE_COLLECTION_NAME).doc(id).delete()
    }

    async getTimeZone() {
        const url = `http://api.timezonedb.com/v2.1/get-time-zone?key=${process.env.TIME_ZONE_API_KEY}&format=json&by=position&lat=${this.lat}&lng=${this.lng}`;
        let returned = await request
            .get(url);
        const {
            body
        } = returned;
        if (body && body.abbreviation) {
            this.timeZone = body.abbreviation;
            this.zoneName = body.zoneName;
            return;
        }
    }

    

    createDatabaseObject() {
        const out = {};
        // Initialize our object with default values for all the keys
        _.forEach(validate.foodResourceSchema.properties, (attrs, property) => {
            if (this[property] && this[property] !== undefined) {
                out[property] = this[property];
                return;
            }
            switch (attrs.type) {
                case "string":
                    out[property] = '';
                    break;
                case "integer":
                    out[property] = 0;
                    break;
                case "number":
                    out[property] = 0;
                    break;
                case "array":
                    out[property] = [];
                    break;
                case "boolean":
                    out[property] = false;
                    break;
            }
        })

        if (!out.id || out.id.length === 0) {
            // out.id = firebase.ref('events').push().key;
        }
        return out;
    }
}

module.exports = FoodResource;