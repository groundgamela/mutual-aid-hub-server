const AWS = require('aws-sdk');

const superagent = require('superagent');
const mapboxapi = 'https://api.mapbox.com/uploads/v1';

const uploadToMapbox = (url) => {
  const data = {
    tileset: `${process.env.MAPBOX_USERNAME}.networkstileset`,
    url: url,
    name: 'network-tileset',
  };
  return superagent
    .post(`${mapboxapi}/${process.env.MAPBOX_USERNAME}?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`)
    .send(data)
    .then((res) => {
      console.log(res.body);
    })
    .catch(e => {
      console.log(e);
    });
};

module.exports = (buffer) => {
  return superagent
    .post(`${mapboxapi}/${process.env.MAPBOX_USERNAME}/credentials?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`)
    .then(res => {
      const credentials = res.body;
      console.log(credentials);
      // Use aws-sdk to stage the file on Amazon S3
      var s3 = new AWS.S3({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
        region: 'us-east-1',
      });
      return new Promise((resolve, reject) => {

        s3.putObject({
          Bucket: credentials.bucket,
          Key: credentials.key,
          Body: buffer,
        }, function(err) {
          if (err) {
            console.log('error: ', err);
            return reject(err);
          }
          return uploadToMapbox(credentials.url).then(resolve)
        });
      })
    });
};
