#!/usr/bin/env bash
set -euo pipefail

# Usage: ./infrastructure/deploy.sh <aws-region> <aws-account-id> <db-password> <jwt-secret> <cert-arn>
REGION=${1:-ap-south-1}
ACCOUNT=${2:?AWS account ID required}
DB_PASS=${3:?DB password required}
JWT_SECRET=${4:?JWT secret required}
CERT_ARN=${5:?Certificate ARN required}

APP=crossword-kn
ECR_BASE="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"

echo "==> Logging in to ECR"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_BASE"

for SVC in backend frontend; do
  REPO="$ECR_BASE/$APP-$SVC"
  aws ecr describe-repositories --repository-names "$APP-$SVC" --region "$REGION" 2>/dev/null || \
    aws ecr create-repository --repository-name "$APP-$SVC" --region "$REGION"
  echo "==> Building $SVC"
  docker build -t "$REPO:latest" "./$SVC"
  docker push "$REPO:latest"
done

echo "==> Deploying CloudFormation stack"
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$APP" \
  --template-file infrastructure/cloudformation.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AppName="$APP" \
    BackendImage="$ECR_BASE/$APP-backend:latest" \
    FrontendImage="$ECR_BASE/$APP-frontend:latest" \
    DBPassword="$DB_PASS" \
    JwtSecret="$JWT_SECRET" \
    CertificateArn="$CERT_ARN"

echo "==> Done. Get ALB DNS:"
aws cloudformation describe-stacks --stack-name "$APP" --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text
