const Ajv = require('ajv');

const mutualAidNetwork = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://example.com/gobalxrEvent.schema.json",
  "title": "Product",
  "description": "An event",
  "type": "object",
  "additionalProperties": true,
  "properties": {
    "title": {
      "description": "title of the network",
      "type": "string",
    },
    "neighborhood": {
      "description": "neighborhood of the network",
      "type": "string",
    },
    "address": {
      "description": "address of the network",
      "type": "string",
    },
    "city": {
      "description": "city covered",
      "type": "string",
    },
    "state": {
      "description": "state covered",
      "type": "string",
    },
    "country": {
      "description": "Country where the event takes place",
      "type": "string",
    },
    "generalForm": {
      "description": "url to the form",
      "type": "string",
    },
    "supportRequestForm": {
      "description": "url to the request",
      "type": "string",
    },
    "supportOfferForm": {
      "description": "url to the offer",
      "type": "string",
    },
    "facebookPage": {
      "description": "social media link",
      "type": "string",
    },

    "language": {
      "description": "language spoken",
      "type": "string",
    },
    "displayFilterTags": {
      "description": "tags for filtering",
      "type": "array",
    },
    "backendTags": {
      "description": "tags for filtering",
      "type": "array",
    },
    "zipCode": {
      "description": "zipcode",
      "type": "string",
    },
    "hotlineNumber": {
      "description": "number for contact",
      "type": "string",
    },
    "community": {
      "description": "specific community served",
      "type": "string",
    },
    "lat": {
      "description": "Latitude of the network",
      "type": "number",
      "minimum": -90,
      "maximum": 90,
    },
    "lng": {
      "description": "Longitude of the network",
      "type": "number",
      "minimum": -180,
      "maximum": 180,
    },
    "bbox": {
      "description": "bounding box of the region",
      "type": "array",
    }
  },
  "required": [
    "address",
    "neighborhood",
    "title",
    "city",
    "state",
    "country",
    "generalForm",
    "supportRequestForm",
    "supportOfferForm",
    "facebookPage",
    "language",
    "community",
    "lat",
    "lng",
    "bbox",
    "zipCode",
    "displayFilterTags",
    "hotlineNumber"
  ],
}

module.exports = {
  mutualAidNetworkSchema: mutualAidNetwork,
  mutualAidNetwork: (new Ajv()).compile(mutualAidNetwork),
}