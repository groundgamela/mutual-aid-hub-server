const tippecanoe = require('tippecanoe').tippecanoeAsync;

const MBTiles = require('@mapbox/mbtiles');
const fsPromises = require('fs').promises;

const {
    firestore
} = require('../lib/setupFirebase');
const Point = require('./Point');
const uploadToS3 = require('../lib/mapboxUpload');

const GENERAL = 'General';
const OFFER_SUPPORT = 'Offer Support';
const REQUEST_SUPPORT = 'Request Support';
const INFORMATION = 'Community';


const getAllNetworksFromDatabase = () => {
    return firestore.collection("mutual_aid_networks").get()
        .then(snapshot => {
            return snapshot.docs.map((doc, index) => {
                const data = doc.data();
                let category = data.category;
                if (!category) {
                    if (data.generalForm || (data.supportRequestForm && data.supportOfferForm)) {
                        category = GENERAL;
                    } else if (data.supportRequestForm) {
                        category = REQUEST_SUPPORT;
                    } else if (data.supportOfferForm) {
                        category = OFFER_SUPPORT;
                    } else {
                        category = INFORMATION;
                    }
                }
                return {
                    ...data,
                    id: index,
                    key: doc.id,
                    category: category,
                }
            });
        })
}

const createFeatures = (networks) => {
    const featuresHome = {
        features: [],
        type: 'FeatureCollection',
    };
    featuresHome.features = networks.map((network) => {
        const newFeature = new Point(network);
        return newFeature;
    });
    return featuresHome;
}

const updateIds = (listOfNetworks) => {
    listOfNetworks.forEach(async (network) => {
        await firestore.collection("mutual_aid_networks").doc(network.key)
            .update({
                id: network.id,
                category: network.category
            });
        return network.id;
    })
}

getAllNetworksFromDatabase()
    .then(allNetworks => {
        const geoJson = createFeatures(allNetworks);
        fsPromises.writeFile('./tmp/ma-networks.geojson', JSON.stringify(geoJson))
            .then(() => {
                tippecanoe(['./tmp/ma-networks.geojson'], {
                    zg: true,
                    output: './tmp/ma-networks-tileset.mbtiles',
                    force: true,
                }).then(() => {
                    fsPromises.readFile('./tmp/ma-networks-tileset.mbtiles')
                        .then((buffer) => {
                            uploadToS3(buffer)
                                .then(() => {
                                    updateIds(allNetworks);
                                })
                        })
                    
               
            }).catch(console.log)
    }).catch(console.log)
})