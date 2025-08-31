#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display messages
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Check if required tools are installed
check_prerequisites() {
  log "Checking prerequisites..."
  
  if ! command -v aws &> /dev/null; then
    error "AWS CLI is not installed. Please install it first."
  fi
  
  if ! command -v terraform &> /dev/null; then
    error "Terraform is not installed. Please install it first."
  fi
  
  if ! command -v kubectl &> /dev/null; then
    error "kubectl is not installed. Please install it first."
  fi
  
  if ! aws sts get-caller-identity &> /dev/null; then
    error "AWS CLI is not configured properly. Please run 'aws configure'."
  fi
  
  log "All prerequisites are met."
}

# Initialize Terraform
init_terraform() {
  log "Initializing Terraform..."
  cd "$(dirname "$0")/../terraform"
  terraform init
  log "Terraform initialized successfully."
}

# Apply Terraform changes
apply_terraform() {
  log "Applying Terraform changes..."
  cd "$(dirname "$0")/../terraform"
  
  if [ -z "$DB_PASSWORD" ]; then
    warn "DB_PASSWORD environment variable is not set. Using default value from tfvars file."
    terraform apply -auto-approve
  else
    terraform apply -auto-approve -var="db_password=$DB_PASSWORD"
  fi
  
  log "Infrastructure provisioned successfully."
}

# Configure kubectl to use the EKS cluster
configure_kubectl() {
  log "Configuring kubectl to use the EKS cluster..."
  cd "$(dirname "$0")/../terraform"
  
  CLUSTER_NAME=$(terraform output -raw cluster_name)
  AWS_REGION=$(terraform output -raw aws_region)
  
  aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
  
  log "kubectl configured successfully."
}

# Deploy the application to EKS
deploy_application() {
  log "Deploying the application to EKS..."
  cd "$(dirname "$0")/../k8s"
  
  # Get database endpoint from Terraform output
  cd "$(dirname "$0")/../terraform"
  DB_HOST=$(terraform output -raw db_endpoint)
  cd "$(dirname "$0")/../k8s"
  
  # Replace placeholders in Kubernetes manifests
  sed -i '' "s/\${DATABASE_HOST}/$DB_HOST/g" configmap.yaml
  
  # Create base64 encoded secrets
  if [ -z "$DB_PASSWORD" ]; then
    error "DB_PASSWORD environment variable is not set. Cannot create Kubernetes secrets."
  fi
  
  if [ -z "$JWT_SECRET" ]; then
    warn "JWT_SECRET environment variable is not set. Generating a random one."
    JWT_SECRET=$(openssl rand -base64 32)
  fi
  
  DB_PASSWORD_BASE64=$(echo -n "$DB_PASSWORD" | base64)
  JWT_SECRET_BASE64=$(echo -n "$JWT_SECRET" | base64)
  
  sed -i '' "s/\${BASE64_DATABASE_PASSWORD}/$DB_PASSWORD_BASE64/g" secret.yaml
  sed -i '' "s/\${BASE64_JWT_SECRET}/$JWT_SECRET_BASE64/g" secret.yaml
  
  # Get ECR repository URI from Terraform output
  cd "$(dirname "$0")/../terraform"
  ECR_REPO_URI=$(terraform output -raw ecr_repository_url)
  cd "$(dirname "$0")/../k8s"
  
  sed -i '' "s|\${ECR_REPOSITORY_URI}|$ECR_REPO_URI|g" deployment.yaml
  
  # Apply Kubernetes manifests
  kubectl apply -f namespace.yaml
  kubectl apply -f configmap.yaml
  kubectl apply -f secret.yaml
  kubectl apply -f deployment.yaml
  kubectl apply -f service.yaml
  kubectl apply -f ingress.yaml
  
  log "Application deployed successfully."
}

# Deploy frontend to S3
deploy_frontend() {
  log "Deploying frontend to S3..."
  cd "$(dirname "$0")/../../BookCritic-FE"
  
  # Get S3 bucket name and API URL from Terraform output
  cd "$(dirname "$0")/../terraform"
  S3_BUCKET=$(terraform output -raw frontend_bucket_name)
  API_URL=$(terraform output -raw api_endpoint)
  cd "$(dirname "$0")/../../BookCritic-FE"
  
  # Build frontend with API URL
  export REACT_APP_API_URL="$API_URL"
  npm run build:prod
  
  # Upload to S3
  aws s3 sync build/ "s3://$S3_BUCKET" --delete
  
  # Get CloudFront distribution ID if available
  cd "$(dirname "$0")/../terraform"
  if terraform output -raw cloudfront_distribution_id &> /dev/null; then
    CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*"
    log "CloudFront cache invalidated."
  fi
  
  log "Frontend deployed successfully."
}

# Main function
main() {
  check_prerequisites
  
  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --init-only)
        init_terraform
        exit 0
        ;;
      --terraform-only)
        init_terraform
        apply_terraform
        exit 0
        ;;
      --backend-only)
        configure_kubectl
        deploy_application
        exit 0
        ;;
      --frontend-only)
        deploy_frontend
        exit 0
        ;;
      *)
        warn "Unknown option: $1"
        ;;
    esac
    shift
  done
  
  # Run all steps by default
  init_terraform
  apply_terraform
  configure_kubectl
  deploy_application
  deploy_frontend
  
  log "Deployment completed successfully!"
  
  # Print application URLs
  cd "$(dirname "$0")/../terraform"
  echo -e "\n${GREEN}Application URLs:${NC}"
  echo -e "Backend API: $(terraform output -raw api_endpoint)"
  echo -e "Frontend: $(terraform output -raw frontend_url)"
}

main "$@"
