# BookCritic AWS Deployment

This repository contains Terraform scripts to deploy the BookCritic application on AWS. The infrastructure includes EC2 for the backend, RDS for the database, and S3 for frontend static hosting.

## Prerequisites

Before you begin, make sure you have the following:

1. [AWS CLI](https://aws.amazon.com/cli/) installed and configured
2. [Terraform](https://www.terraform.io/downloads.html) (v1.5.0 or later) installed
3. An AWS account with appropriate permissions
4. SSH key pair created in AWS (for EC2 access)
5. GitHub repositories for both frontend and backend code

## Infrastructure Components

The deployment creates the following AWS resources:

- **VPC** with public and private subnets
- **EC2 instance** for the NestJS backend
- **RDS PostgreSQL** instance (publicly accessible for learning purposes)
- **S3 bucket** configured for static website hosting
- Security groups, IAM roles, and other supporting resources

## Deployment Steps

### 1. Configure Variables

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` to set your specific values:
   - Update GitHub repository URLs
   - Set a strong database password
   - Choose a globally unique S3 bucket name
   - Verify the AWS region is set to `us-east-1`
   - Ensure the SSH key name matches an existing key pair in your AWS account

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan the Deployment

```bash
terraform plan
```

Review the plan to ensure it will create the expected resources.

### 4. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### 5. Access Deployment Information

After the deployment completes, Terraform will output important information:

- Backend URL (EC2 public DNS)
- Frontend URL (S3 website endpoint)
- RDS endpoint for database connections
- Other resource IDs and endpoints

## Setting Up CI/CD

### Backend CI/CD (GitHub Actions)

1. Copy the backend workflow file to your backend repository:
   ```bash
   mkdir -p /path/to/backend/repo/.github/workflows/
   cp backend-workflow.yml /path/to/backend/repo/.github/workflows/ci-cd.yml
   ```

2. Add the following secrets to your GitHub repository:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `SSH_PRIVATE_KEY`: The private key for SSH access to EC2

### Frontend CI/CD (GitHub Actions)

1. Copy the frontend workflow file to your frontend repository:
   ```bash
   mkdir -p /path/to/frontend/repo/.github/workflows/
   cp frontend-workflow.yml /path/to/frontend/repo/.github/workflows/ci-cd.yml
   ```

2. Add the following secrets to your GitHub repository:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `S3_BUCKET_NAME`: The name of your S3 bucket
   - `REACT_APP_API_URL`: The URL of your backend API
   - `CLOUDFRONT_DISTRIBUTION_ID` (optional): If you set up CloudFront

## Manual Deployment (if needed)

### Backend Manual Deployment

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Pull the latest code
cd /home/ubuntu/bookcritic-backend
git pull

# Install dependencies and build
npm install
npm run build

# Restart the application
pm2 restart bookcritic
```

### Frontend Manual Deployment

```bash
# Build the frontend locally
npm run build

# Deploy to S3
aws s3 sync build/ s3://your-bucket-name --delete
```

## Monitoring

Basic monitoring is set up on the EC2 instance:
- A cron job runs every 5 minutes to check if services are running
- System metrics are logged to `/home/ubuntu/system_metrics.log`

## Cleanup

To destroy all created resources when they're no longer needed:

```bash
terraform destroy
```

Type `yes` when prompted to confirm.

## Security Notes

For learning purposes, this deployment includes:
- A publicly accessible RDS instance
- Simple security groups with broad access

In a production environment, you would want to:
- Make RDS private and accessible only from your application
- Implement more restrictive security groups
- Set up proper monitoring and alerting
- Use AWS Secrets Manager for sensitive information
- Implement proper backup strategies
