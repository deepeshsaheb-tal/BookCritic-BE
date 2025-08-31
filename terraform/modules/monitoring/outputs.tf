output "log_group_name" {
  description = "The name of the CloudWatch log group for EKS cluster logs"
  value       = aws_cloudwatch_log_group.eks_cluster_logs.name
}

output "log_group_arn" {
  description = "The ARN of the CloudWatch log group for EKS cluster logs"
  value       = aws_cloudwatch_log_group.eks_cluster_logs.arn
}

output "dashboard_name" {
  description = "The name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.eks_dashboard.dashboard_name
}

output "dashboard_arn" {
  description = "The ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.eks_dashboard.dashboard_arn
}

output "cpu_alarm_arn" {
  description = "The ARN of the CPU utilization alarm for EKS"
  value       = aws_cloudwatch_metric_alarm.eks_cpu_high.arn
}

output "memory_alarm_arn" {
  description = "The ARN of the memory utilization alarm for EKS"
  value       = aws_cloudwatch_metric_alarm.eks_memory_high.arn
}

output "rds_cpu_alarm_arn" {
  description = "The ARN of the CPU utilization alarm for RDS"
  value       = aws_cloudwatch_metric_alarm.rds_cpu_high.arn
}

output "rds_storage_alarm_arn" {
  description = "The ARN of the storage space alarm for RDS"
  value       = aws_cloudwatch_metric_alarm.rds_storage_low.arn
}
