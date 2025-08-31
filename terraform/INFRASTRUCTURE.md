# BookCritic Infrastructure Documentation

This document provides an overview of the AWS infrastructure deployed for the BookCritic application using Terraform.

## Infrastructure Components

### 1. VPC and Networking
- **VPC Name**: bookcritic-vpc
- **CIDR Block**: 10.0.0.0/16
- **Availability Zones**: us-east-1a, us-east-1b, us-east-1c
- **Subnet Types**:
  - Private Subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
  - Public Subnets: 10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24
  - Database Subnets: 10.0.201.0/24, 10.0.202.0/24, 10.0.203.0/24
- **NAT Gateways**: One per availability zone for private subnet internet access
- **Internet Gateway**: For public subnet internet access
- **Route Tables**: Separate route tables for public, private, and database subnets

### 2. EKS Cluster
- **Cluster Name**: bookcritic-eks-cluster
- **Kubernetes Version**: 1.28
- **Node Group**: bookcritic-node-group
- **Instance Types**: t3.medium
- **Scaling Configuration**:
  - Desired Size: 2
  - Min Size: 1
  - Max Size: 3
- **Networking**: Deployed in private subnets with security groups

### 3. RDS Database
- **Instance Identifier**: bookcritic-db
- **Engine**: PostgreSQL 14.12
- **Instance Class**: db.t3.small
- **Storage**: 20GB gp2
- **Database Name**: bookcritic
- **Networking**: Deployed in database subnets with security group
- **Endpoint**: bookcritic-db.cszgwc6c6kyk.us-east-1.rds.amazonaws.com:5432

### 4. S3 Bucket
- **Bucket Name**: bookcritic-frontend-assets
- **Purpose**: Hosting static frontend assets
- **Configuration**:
  - Public read access
  - Website hosting enabled
  - CORS configured for frontend access

## Limitations and Workarounds

### Permission Issues
1. **CloudWatch Logging**
   - **Issue**: Insufficient permissions to create CloudWatch log groups
   - **Workaround**: Disabled CloudWatch logging in the EKS cluster

2. **Helm Charts**
   - **Issue**: Insufficient permissions to deploy Helm charts
   - **Workaround**: Commented out Helm releases for AWS Load Balancer Controller and metrics-server

3. **Remote State**
   - **Issue**: Insufficient permissions to create S3 bucket and DynamoDB table for remote state
   - **Workaround**: Using local state instead of remote state

### Version Compatibility
1. **Kubernetes Version**
   - **Issue**: Initially specified versions (1.27, 1.24) were not supported
   - **Solution**: Updated to Kubernetes version 1.28

2. **PostgreSQL Version**
   - **Issue**: Initially specified version 14.10 was not available
   - **Solution**: Updated to PostgreSQL version 14.12

## Future Improvements

1. **Enable CloudWatch Logging**
   - Request additional IAM permissions to enable CloudWatch logging for better monitoring

2. **Deploy Kubernetes Add-ons**
   - Deploy AWS Load Balancer Controller and metrics-server for improved cluster functionality

3. **Implement Remote State**
   - Set up S3 bucket and DynamoDB table for remote state management

4. **Enable Enhanced Monitoring**
   - Enable RDS enhanced monitoring and performance insights

5. **Implement Auto-scaling**
   - Configure auto-scaling for the EKS node group based on workload

## Deployment Instructions

1. Initialize Terraform:
   ```
   terraform init
   ```

2. Apply VPC module:
   ```
   terraform apply -target=module.vpc
   ```

3. Apply EKS module:
   ```
   terraform apply -target=module.eks
   ```

4. Apply RDS module:
   ```
   terraform apply -target=module.rds
   ```

5. Apply S3 module:
   ```
   terraform apply -target=module.s3
   ```

6. Apply all remaining resources:
   ```
   terraform apply
   ```

## Accessing Resources

### EKS Cluster
To configure kubectl to use the EKS cluster:
```
aws eks update-kubeconfig --name bookcritic-eks-cluster --region us-east-1
```

### RDS Database
Connect to the RDS database using:
- **Host**: bookcritic-db.cszgwc6c6kyk.us-east-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: bookcritic
- **Username**: postgres
- **Password**: postgres (change this to a secure password in production)

### S3 Website
Access the frontend website at:
```
http://bookcritic-frontend-assets.s3-website-us-east-1.amazonaws.com
```
