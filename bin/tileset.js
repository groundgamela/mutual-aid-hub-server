
const fsPromises = require('fs').promises;

const find = require('lodash').find;

const {
    publishTileset,
    checkStatus,
    updateTileSet,
    postSource,
    getSources,
    deleteSource
} = require('../lib/mapbox-tileset-api');

const {
    firestore
} = require('../lib/setupFirebase');
const Point = require('./Point');

const GENERAL = 'General';
const OFFER_SUPPORT = 'Offer Support';
const REQUEST_SUPPORT = 'Request Support';
const INFORMATION = 'Community';

const SOURCE_ID_A = "mutual-aid-source-a";
const SOURCE_ID_B = "mutual-aid-source-b";
const TILESET_ID = "mutual-aid-tileset";

const getRecipe = (sourceId) => ({
    version: 1,
    layers: {
        mutual_aid_networks: {
            source: `mapbox://tileset-source/${process.env.MAPBOX_USERNAME}/${sourceId}`,
            minzoom: 0,
            maxzoom: 16
        }
    }

})

//https://api.mapbox.com/tilesets/v1/sources/townhallproject/hello-world?access_token=YOUR MAPBOX ACCESS TOKEN

const getAllNetworksFromDatabase = async () => {
    const snapshot = await firestore.collection("mutual_aid_networks").get();
    return snapshot.docs.map((doc, index) => {
        const data = doc.data();
        let category = data.category;
        if (!category) {
            if (data.generalForm || (data.supportRequestForm && data.supportOfferForm)) {
                category = GENERAL;
            }
            else if (data.supportRequestForm) {
                category = REQUEST_SUPPORT;
            }
            else if (data.supportOfferForm) {
                category = OFFER_SUPPORT;
            }
            else {
                category = INFORMATION;
            }
        }
        return {
            ...data,
            id: index,
            key: doc.id,
            category: category,
        };
    });
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


const getPreviousSource = (nextSource) => nextSource === SOURCE_ID_B ? SOURCE_ID_A : SOURCE_ID_B;

const getNextSource = async () => {
    const sources = await getSources()
    const useB = find(sources, {id : `mapbox://tileset-source/${process.env.MAPBOX_USERNAME}/${SOURCE_ID_A}`});
    return useB ? SOURCE_ID_B : SOURCE_ID_A;
}

const makeNewSource = async (sourceName, allNetworks) => {

    const geoJson = createFeatures(allNetworks);
    ldGeoJson = geoJson.features.reduce((acc, cur) => {
        acc = acc + JSON.stringify(cur) + '\n';
        return acc;
    }, '');
    await fsPromises.writeFile('tmp/ma-networks.geojson.ld', ldGeoJson);
    return postSource(sourceName, 'tmp/ma-networks.geojson.ld');
}

const updateIds = (listOfNetworks) => {

    return Promise.all(listOfNetworks.map((network) => {
        return firestore.collection("mutual_aid_networks").doc(network.key)
            .update({
                id: network.id,
                category: network.category
            });
    }))
}

processNewData = () => {
    getNextSource()
        .then(async (nextSourceId) => {
            console.log('nextSourceId', nextSourceId)
            const allNetworks = await getAllNetworksFromDatabase();

            makeNewSource(nextSourceId, allNetworks)
                .then(() => updateTileSet(TILESET_ID, nextSourceId, getRecipe(nextSourceId)))
                .then(() => publishTileset(TILESET_ID))
                .then(() => deleteSource(getPreviousSource(nextSourceId)))
                .then(() => updateIds(allNetworks))
                .then(() => process.exit(0))
                })
        
}

init = () => {
    checkStatus(TILESET_ID)
        .then((status) => {
            console.log('prev status: ', status)
            if (status === 'processing') {
                return setTimeout(init, 30000)
            }
            processNewData();
        })
}

init();


