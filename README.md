This is a very simple Google Cloud Function which synchronizes a GCS bucket with an S3 bucket.

## Deployment

This script uses runtime configuration as described here:
https://cloud.google.com/deployment-manager/runtime-configurator/create-and-delete-runtimeconfig-resources

* First, you'll need to define some environment variables:
```
# Name of your GCP project
PROJECT=my-gcp-project
# Name for the runtime config (this MUST match the bucket name)
CONFIG_NAME=my-source-bucket
# AWS region in which your S3 bucket was created
S3_REGION=us-east-1
# Name of the S3 bucket
S3_TARGET_BUCKET=my-target-bucket
# Name for your Cloud Function
CLOUD_FUNCTION_NAME=syncMyBucket
# GCS Bucket where Cloud Function zip files are stored.
GCS_STAGING_BUCKET=my-cloud-function-bucket
# GCS source bucket to be synced
GCS_SOURCE_BUCKET=my-source-bucket
```
* Next, create the runtime config and variables
```
gcloud --project $PROJECT beta runtime-config configs create $CONFIG_NAME
gcloud --project $PROJECT beta runtime-config configs variables set aws-access-key $AWS_ACCESS_KEY_ID --config-name=$CONFIG_NAME
gcloud --project $PROJECT beta runtime-config configs variables set aws-secret-key $AWS_SECRET_ACCESS_KEY --config-name=$CONFIG_NAME
gcloud --project $PROJECT beta runtime-config configs variables set aws-region $S3_REGION --config-name=$CONFIG_NAME
gcloud --project $PROJECT beta runtime-config configs variables set aws-bucket $S3_TARGET_BUCKET --config-name=$CONFIG_NAME
```
* Finally, deploy the Cloud Function
```
gcloud --project $PROJECT beta functions deploy $CLOUD_FUNCTION_NAME --stage-bucket $GCS_STAGING_BUCKET \
--trigger-event providers/cloud.storage/eventTypes/object.change \
--trigger-resource $GCS_SOURCE_BUCKET \
--entry-point syncGCS --runtime nodejs10 \
--set-env-vars GCLOUD_PROJECT=$PROJECT
```

## Troubleshooting

Logs for the function are available in stackdriver at https://console.cloud.google.com/logs/viewer?project=${PROJECT}&resource=cloud_function%2Ffunction_name%2F${CLOUD_FUNCTION_NAME}

Simply substitute the appropriate values for ${PROJECT} and ${CLOUD_FUNCTION_NAME} in the URL

