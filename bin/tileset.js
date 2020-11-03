
const fsPromises = require('fs').promises;
const mkdirp = require('mkdirp');
const { NETWORK_COLLECTION_NAME } = require('../constants');

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
const NetworkPoint = require('../network/point');

const NETWORK = 'Network';


const SOURCE_ID_A = "mutual-aid-source-a-testing";
const SOURCE_ID_B = "mutual-aid-source-b-testing";
const PRODUCTION_TILESET_ID = "mutual-aid-tileset";
const TILESET_ID = PRODUCTION_TILESET_ID;
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
    const networks = await firestore.collection(NETWORK_COLLECTION_NAME).get();
    return networks.map((doc, index) => {
        const data = doc.data();
        let category = data.category;
        if (!data.category) {
            category = NETWORK;
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
        let newFeature = new NetworkPoint(network);
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
    console.log('writing file')
    const pathName = __dirname + '/../tmp/';
    const fileName = pathName + 'ma-networks.geojson.ld';
    await mkdirp(pathName);
    await fsPromises.writeFile(fileName, ldGeoJson);
    console.log('wrote file')
    return postSource(sourceName, fileName);
}

const updateIds = (listOfNetworks) => {

    return Promise.all(listOfNetworks.map((network) => {
        const collection = NETWORK_COLLECTION_NAME;
        return firestore.collection(collection).doc(network.key)
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
                // .then(() => makeNewTileset(TILESET_ID, nextSourceId)) // need to run the first time
                .then(() => updateTileSet(TILESET_ID, nextSourceId, getRecipe(nextSourceId)))
                .then(() => publishTileset(TILESET_ID))
                .then(() => deleteSource(getPreviousSource(nextSourceId)))
                .then(() => updateIds(allNetworks))
                .then(() => process.exit(0))
                .catch(console.log)
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


