const random = require('lodash').random;
class Point {
    constructor(network) {
        const jitterSide = random(-0.008, 0.008);
        const jitterUp = random(-0.008, 0.008);
        this.type = 'Feature';
        this.geometry = {
            coordinates: [Number(network.lng + jitterUp), Number(network.lat) + jitterSide],
            type: 'Point',
        };
        const scale = network.bbox[3] - network.bbox[1];
        this.properties = {
            neighborhood: network.neighborhood,
            facebookPage: network.facebookPage,
            state: network.state,
            city: network.city || null,
            title: network.title,
            generalForm: network.generalForm,
            supportRequestForm: network.supportRequestForm,
            supportOfferForm: network.supportOfferForm,
            category: network.category,
            bbox: network.bbox,
            lat: network.lat,
            lng: network.lng,
            scale: scale * 10,
            id: network.id,
        };
        this.id = network.id;
    }
}

module.exports = Point;
