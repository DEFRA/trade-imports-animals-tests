#!/bin/bash

# S3 buckets
aws --endpoint-url=$LOCALSTACK_URL s3 --region $AWS_REGION mb s3://cdp-uploader-quarantine
aws --endpoint-url=$LOCALSTACK_URL s3 --region $AWS_REGION mb s3://trade-imports-animals-documents

# SQS queues
aws --endpoint-url=$LOCALSTACK_URL sqs create-queue --region $AWS_REGION --queue-name cdp-clamav-results
aws --endpoint-url=$LOCALSTACK_URL sqs create-queue --region $AWS_REGION --queue-name cdp-uploader-download-requests
aws --endpoint-url=$LOCALSTACK_URL sqs create-queue --region $AWS_REGION --queue-name mock-clamav
aws --endpoint-url=$LOCALSTACK_URL sqs create-queue --region $AWS_REGION --queue-name cdp-uploader-scan-results-callback.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true

# S3 event notifications — trigger mock virus scanner when files land in quarantine
MOCK_CLAMAV_ARN="arn:aws:sqs:${AWS_REGION}:000000000000:mock-clamav"
aws --endpoint-url=$LOCALSTACK_URL s3api put-bucket-notification-configuration \
  --bucket cdp-uploader-quarantine \
  --region $AWS_REGION \
  --notification-configuration "{\"QueueConfigurations\":[{\"Id\":\"mock-virus-scan\",\"QueueArn\":\"${MOCK_CLAMAV_ARN}\",\"Events\":[\"s3:ObjectCreated:*\"]}]}"
