/**
 * Background Cloud Function to be triggered by Cloud Storage.
 *
 * @param {object} event The Cloud Functions event.
 * @param {function} callback The callback function.
 */

'use strict';
const S3 = require('aws-sdk/clients/s3');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
// const runtimeConfig = require('cloud-functions-runtime-config');
const runtimeConfig = require('./runtime-config');

exports.syncGCS = function (data, context, callback) {
  const file = data;

  if (file.resourceState === 'not_exists') {
    console.log(`File ${file.name} deleted.`);
  } else if (file.metageneration === '1') {
    // metageneration attribute is updated on metadata changes.
    // on create value is 1
    console.log(`File ${file.name} uploaded.`);

    const configName = data.bucket;

    // Fetch "environment" from Google Runtime Configuration
    const awsBucketP = runtimeConfig.getVariable(configName, 'aws-bucket');
    const awsAccessKeyP = runtimeConfig.getVariable(configName, 'aws-access-key');
    const awsSecretKeyP = runtimeConfig.getVariable(configName, 'aws-secret-key');
    const regionP = runtimeConfig.getVariable(configName, 'aws-region');

    Promise.all([ awsBucketP, awsAccessKeyP, awsSecretKeyP, regionP ]).then(values => {
        console.log(`Access key ${values[1]} ; target bucket ${values[0]}`);
        var bucket = storage.bucket(data.bucket);
        var remoteReadStream = bucket.file(file.name).createReadStream();
        var s3obj = new S3({params: {Bucket: values[0], Key: file.name}, credentials: { accessKeyId: values[1], secretAccessKey: values[2] }});
        s3obj.upload({Body: remoteReadStream})
          .on('httpUploadProgress', function(evt) { console.log(evt); })
          .send(function(err, data) { console.log(err, data) });
    }).catch(function(e){console.log(e)});
  } else {
    console.log(`File ${file.name} metadata updated.`);
  }
  callback();
};

