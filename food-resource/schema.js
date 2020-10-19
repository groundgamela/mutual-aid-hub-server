const Ajv = require('ajv');

const foodResource = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://example.com/gobalxrEvent.schema.json",
  "title": "Product",
  "description": "A food resource",
  "type": "object",
  "additionalProperties": true,
  "properties": {
    "title": {
      "description": "title of the food resource",
      "type": "string",
    },
    "resources": {
      "description": "list of types of resources",
      "type": "object",
      "fridge": {
        "description": "fridge available",
        "type": "boolean"
      },
      "freezer": {
        "description": "freezer available",
        "type": "boolean"
      },
      "pantry": {
        "description": "pantry available",
        "type": "boolean"
      },
      "foodBank": {
        "description": "foodBank available",
        "type": "boolean"
      }
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
    "twitter": {
      "description": "social media link",
      "type": "string",
    },
    "instagram": {
      "description": "social media link",
      "type": "string",
    },
    "facebook": {
      "description": "social media link",
      "type": "string",
    },
    "website": {
      "description": "website link",
      "type": "string",
    },
    "geocodeStatus": {
      "description": "status of errors or settings",
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
    "resources",
    "title",
    "city",
    "state",
    "geocodeStatus",
    "lat",
    "lng",
    "bbox",
  ],
}

module.exports = {
  foodResourceSchema: foodResource,
  foodResource: (new Ajv()).compile(foodResource),
}