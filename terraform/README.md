# BookCritic Infrastructure

This repository contains the Terraform code for provisioning the infrastructure for the BookCritic application on AWS.

## Architecture

The infrastructure consists of the following components:

- **VPC**: A Virtual Private Cloud with public, private, and database subnets across multiple availability zones
- **EKS**: Amazon Elastic Kubernetes Service for container orchestration
- **RDS**: Amazon RDS PostgreSQL database for persistent storage
- **S3**: Amazon S3 bucket for hosting frontend static assets
- **CloudWatch**: Monitoring and logging for the application and infrastructure

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) (v1.5.0 or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) for interacting with the Kubernetes cluster

## Getting Started

1. Initialize Terraform:

```bash
terraform init
```

2. Create a `terraform.tfvars` file with your configuration:

```hcl
aws_region         = "us-east-1"
cluster_name       = "bookcritic-eks-cluster"
vpc_name           = "bookcritic-vpc"
db_name            = "bookcritic"
db_username        = "postgres"
db_password        = "your-secure-password"  # Replace with a secure password
frontend_bucket_name = "bookcritic-frontend-assets"
```

3. Plan the deployment:

```bash
terraform plan
```

4. Apply the changes:

```bash
terraform apply
```

5. Configure kubectl to use the new EKS cluster:

```bash
aws eks update-kubeconfig --name bookcritic-eks-cluster --region us-east-1
```

## CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions and consists of the following stages:

1. **Test**: Run linting and unit tests
2. **Build**: Build Docker images and push to Amazon ECR
3. **Deploy**: Deploy the application to EKS
4. **Terraform**: Apply infrastructure changes

## Folder Structure

```
terraform/
├── main.tf              # Main Terraform configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── modules/
│   ├── eks/             # EKS cluster module
│   ├── vpc/             # VPC and networking module
│   ├── rds/             # RDS database module
│   ├── s3/              # S3 bucket module
│   └── monitoring/      # CloudWatch monitoring module
└── README.md            # This file
```

## Monitoring and Logging

- CloudWatch dashboards are set up to monitor the EKS cluster, RDS database, and application metrics
- CloudWatch alarms are configured to alert on high CPU and memory usage
- EKS cluster logs are sent to CloudWatch Logs

## Security

- All sensitive data is stored in AWS Secrets Manager or as Kubernetes secrets
- Network security is enforced using security groups and network ACLs
- IAM roles follow the principle of least privilege
- All data is encrypted at rest and in transit

## Backup and Disaster Recovery

- RDS automated backups are enabled with a 7-day retention period
- Database snapshots are taken daily
- S3 versioning is enabled for frontend assets

## Scaling

- EKS node group is configured with auto-scaling based on CPU utilization
- Horizontal Pod Autoscaler is set up for the application deployments
