#!/bin/bash
set -euo pipefail

# S3 buckets (|| true makes creation idempotent on restart)
aws --endpoint-url="$LOCALSTACK_URL" s3 --region "$AWS_REGION" mb s3://cdp-uploader-quarantine || true
aws --endpoint-url="$LOCALSTACK_URL" s3 --region "$AWS_REGION" mb s3://trade-imports-animals-documents || true

# SQS queues (|| true makes creation idempotent on restart)
aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" --queue-name cdp-clamav-results || true
aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" --queue-name cdp-uploader-download-requests || true
aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" --queue-name mock-clamav || true
aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" --queue-name cdp-uploader-scan-results-callback.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true || true

# S3 event notifications — trigger mock virus scanner when files land in quarantine
MOCK_CLAMAV_ARN="arn:aws:sqs:${AWS_REGION}:000000000000:mock-clamav"
aws --endpoint-url="$LOCALSTACK_URL" s3api put-bucket-notification-configuration \
  --bucket cdp-uploader-quarantine \
  --region "$AWS_REGION" \
  --notification-configuration "{\"QueueConfigurations\":[{\"Id\":\"mock-virus-scan\",\"QueueArn\":\"${MOCK_CLAMAV_ARN}\",\"Events\":[\"s3:ObjectCreated:*\"]}]}"
