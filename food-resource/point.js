const random = require('lodash').random;
class Point {
    constructor(resource) {
        const jitterSide = random(-0.008, 0.008);
        const jitterUp = random(-0.008, 0.008);
        this.type = 'Feature';
        this.geometry = {
            coordinates: [Number(resource.lng + jitterUp), Number(resource.lat) + jitterSide],
            type: 'Point',
        };
        const scale = resource.bbox[3] - resource.bbox[1];
        this.properties = {
            address: resource.address,
            state: resource.state,
            city: resource.city || null,
            title: resource.title,
            category: resource.category,
            bbox: resource.bbox,
            lat: resource.lat,
            lng: resource.lng,
            scale: scale * 10,
            id: resource.id,
            resources: resource.resources
        };
        this.id = resource.id;
    }
}

module.exports = Point;
