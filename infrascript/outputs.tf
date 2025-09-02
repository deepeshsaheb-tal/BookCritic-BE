output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnets" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnets" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.backend.id
}

output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.backend.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.backend.public_dns
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "s3_website_endpoint" {
  description = "Website endpoint of the S3 bucket"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "s3_website_domain" {
  description = "Website domain of the S3 bucket"
  value       = aws_s3_bucket_website_configuration.frontend.website_domain
}

output "backend_url" {
  description = "URL to access the backend API"
  value       = "http://${aws_instance.backend.public_dns}"
}

output "frontend_url" {
  description = "URL to access the frontend website"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}
