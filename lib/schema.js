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
    "form": {
      "description": "url to the form",
      "type": "string",
    },
    "social": {
      "description": "social media link",
      "type": "string",
    },
    "category": {
      "description": "What type of network this is",
      "type": "string",
      // "enum": [
      //   "Action",
      //   "Activity/Event",
      //   "Meeting",
      //   "Talk",

      // ],
    },
    "language": {
      "description": "language spoken",
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
    "form",
    "social",
    "category",
    "language",
    "community",
    "lat",
    "lng",
    "bbox",
  ],
}

module.exports = {
  mutualAidNetworkSchema: mutualAidNetwork,
  mutualAidNetwork: (new Ajv()).compile(mutualAidNetwork),
}