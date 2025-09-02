variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "bookcritic"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "ec2_ami" {
  description = "AMI ID for the EC2 instance"
  type        = string
  default     = "ami-0c7217cdde317cfec" # Amazon Linux 2023 AMI in us-east-1
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
  default     = "bookcritic-key"
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "bookcritic"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Instance class for the RDS instance"
  type        = string
  default     = "db.t3.micro"
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend static assets"
  type        = string
  default     = "bookcritic-frontend-assets"
}

variable "backend_github_repo" {
  description = "GitHub repository URL for the backend"
  type        = string
  default     = "https://github.com/username/BookCritic-BE.git"
}

variable "frontend_github_repo" {
  description = "GitHub repository URL for the frontend"
  type        = string
  default     = "https://github.com/username/BookCritic-FE.git"
}

variable "node_env" {
  description = "Node environment (development, production)"
  type        = string
  default     = "production"
}
