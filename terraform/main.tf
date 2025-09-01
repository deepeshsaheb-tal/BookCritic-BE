terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
  
  # Using local state instead of remote state
  # If you want to use remote state later, uncomment and configure:
  # backend "s3" {
  #   bucket         = "bookcritic-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "bookcritic-terraform-locks"
  # }

  required_version = ">= 1.5.0"
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster_role" {
  name = "bookcritic-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

# EKS Node Group IAM Role
resource "aws_iam_role" "eks_node_role" {
  name = "bookcritic-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_role.name
}

# Create the EKS cluster
module "eks" {
  source          = "./modules/eks"
  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  cluster_role_arn = aws_iam_role.eks_cluster_role.arn
  node_role_arn   = aws_iam_role.eks_node_role.arn
  node_group_name = var.node_group_name
  instance_types  = var.instance_types
  desired_size    = var.desired_size
  min_size        = var.min_size
  max_size        = var.max_size
}

# Create the VPC and networking components
module "vpc" {
  source = "./modules/vpc"
  vpc_name = var.vpc_name
  vpc_cidr = var.vpc_cidr
  azs      = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  database_subnets = var.database_subnets
  cluster_name = var.cluster_name
}

# Create RDS PostgreSQL instance
module "rds" {
  source = "./modules/rds"
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets
  db_name = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  db_instance_class = var.db_instance_class
}

# Create S3 bucket for static assets
module "s3" {
  source = "./modules/s3"
  bucket_name = var.frontend_bucket_name
}

# Configure CloudWatch for monitoring - commented out due to permission issues
# module "monitoring" {
#   source = "./modules/monitoring"
#   cluster_name = var.cluster_name
# }

# Create bastion host for RDS access
module "bastion" {
  source = "./modules/bastion"
  vpc_id = module.vpc.vpc_id
  subnet_id = module.vpc.public_subnets[0]
  key_name = var.key_name
  rds_security_group_id = module.rds.db_security_group_id
}

# Create ECR repository for container images
module "ecr" {
  source = "./modules/ecr"
  repository_name = var.ecr_repository_name
  environment = var.environment
}
