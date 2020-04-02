const superagent = require('superagent');

const mapboxapi = 'https://api.mapbox.com/tilesets/v1';

//https://api.mapbox.com/tilesets/v1/sources/townhallproject/hello-world?access_token=YOUR MAPBOX ACCESS TOKEN

const postSource = async (sourceName) => {

    try {
        const res = await superagent.post(`${mapboxapi}/sources/${process.env.MAPBOX_USERNAME}/${sourceName}?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`)
            .set("Content-Type", "multipart/form-data")
            .attach('file', 'networks.geojson.ld');
        console.log('posted', res.body);
    } catch (e) {
        console.log('error', e.message, e);
    }
}


const getSources = async () => {
    const res = await superagent.get(`${mapboxapi}/sources/${process.env.MAPBOX_USERNAME}?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`);
    return res.body;
}

const deleteSource = async (sourceName) => {
    await superagent.delete(`${mapboxapi}/sources/${process.env.MAPBOX_USERNAME}/${sourceName}?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`);
}

const getSource = async (sourceName) => {

    const res = await superagent.get(`${mapboxapi}/sources/${process.env.MAPBOX_USERNAME}/${sourceName}?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`);
    return res.body;
}

const validateRecipe = () => {
    superagent.put(`${mapboxapi}/validateRecipe?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`)
        .send(JSON.stringify({
            version: 1,
            layers: {
                networks: {
                    source: "mapbox://tileset-source/townhallproject/ma-network-source",
                    minzoom: 0,
                    maxzoom: 16
                }
            }
        }))
        .set("Content-Type", "application/json")
        .then((res) => {
            console.log(res.body)
        })
        .catch(e => {
            console.log('error', e);
        });
}
const makeNewTileset = async (tilesetId, source) => {
    try {
        const res = await superagent.post(`${mapboxapi}/${process.env.MAPBOX_USERNAME}.${tilesetId}?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`)
            .type('application/json')
            .send({
                recipe: {
                    version: 1,
                    layers: {
                        networks: {
                            source: `mapbox://tileset-source/townhallproject/${source}`,
                            minzoom: 0,
                            maxzoom: 16
                        }
                    }
                }
            })
            .send({
                name: 'network tileset test'
            });
        console.log(res.body);
    } catch (e) {
        console.log('error', e.message, e);
    }
}

const updateTileSet = async (tilesetId, source) => {
    try {
        const res = await superagent.patch(`${mapboxapi}/${process.env.MAPBOX_USERNAME}.${tilesetId}/recipe?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`)
            .type('application/json')
            .send({
                version: 1,
                layers: {
                    networks: {
                        source: `mapbox://tileset-source/townhallproject/${source}`,
                        minzoom: 0,
                        maxzoom: 16
                    }
                }

            })
        console.log(res.body);
    } catch (e) {
        console.log('error', e.message, e);
    }
}

const checkStatus = async (id) => {
    try {
        const res = await superagent.get(`${mapboxapi}/${process.env.MAPBOX_USERNAME}.${id}/status?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`)

        return res.body.status;
    } catch (e) {
        console.log('error', e.message);
    }
}

const publishTileset = async (id) => {
    try {
        const res = await superagent.post(`${mapboxapi}/${process.env.MAPBOX_USERNAME}.${id}/publish?access_token=${process.env.MAPBOX_ACCESS_TOKEN_TILESETS}`)
            .type('application/json');
        console.log(res.body);
    } catch (e) {
        console.log('error', e.message);
    }
}

module.exports = {
    postSource,
    publishTileset,
    checkStatus,
    updateTileSet,
    makeNewTileset,
    validateRecipe,
    getSource,
    getSources,
    deleteSource
}