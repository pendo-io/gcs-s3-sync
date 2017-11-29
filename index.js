/**
 * Background Cloud Function to be triggered by Cloud Storage.
 *
 * @param {object} event The Cloud Functions event.
 * @param {function} callback The callback function.
 */

'use strict';
const AWS = require('aws-sdk');
const gcloud = require('google-cloud');
const runtimeConfig = require('cloud-functions-runtime-config');

exports.syncGCS = function (event, callback) {
  const file = event.data;

  if (file.resourceState === 'not_exists') {
    console.log(`File ${file.name} deleted.`);
  } else if (file.metageneration === '1') {
    // metageneration attribute is updated on metadata changes.
    // on create value is 1
    console.log(`File ${file.name} uploaded.`);

    const configName = event.data.bucket;

    // Fetch "environment" from Google Runtime Configuration
    const awsBucketP = runtimeConfig.getVariable(configName, 'aws-bucket');
    const awsAccessKeyP = runtimeConfig.getVariable(configName, 'aws-access-key');
    const awsSecretKeyP = runtimeConfig.getVariable(configName, 'aws-secret-key');
    const regionP = runtimeConfig.getVariable(configName, 'aws-region');

    Promise.all([ awsBucketP, awsAccessKeyP, awsSecretKeyP, regionP ]).then(values => {
        AWS.config.credentials = new AWS.Credentials(values[1], values[2]);
        var s3 = new AWS.S3({region: values[3] });
        console.log(`Access key ${process.env.AWS_ACCESS_KEY_ID} ; target bucket ${values[0]}`);

        var bucket = gcloud.storage().bucket(event.data.bucket);
        var remoteReadStream = bucket.file(file.name).createReadStream();
        var s3obj = new AWS.S3({params: {Bucket: values[0], Key: file.name}});
        s3obj.upload({Body: remoteReadStream})
          .on('httpUploadProgress', function(evt) { console.log(evt); })
          .send(function(err, data) { console.log(err, data) });
    }).catch(function(e){console.log(e)});
  } else {
    console.log(`File ${file.name} metadata updated.`);
  }
  callback();
};

