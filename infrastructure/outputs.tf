output "public_ip" {
  description = "Elastic IP of the EC2 instance — set this as the EC2_HOST GitHub Secret"
  value       = aws_eip.app.public_ip
}

output "s3_bucket_name" {
  description = "S3 bucket name — add as AWS_S3_BUCKET in the .env on the instance"
  value       = aws_s3_bucket.uploads.bucket
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh ubuntu@${aws_eip.app.public_ip}"
}

output "api_url" {
  description = "API base URL once nginx and SSL are configured"
  value       = "https://${aws_eip.app.public_ip}.nip.io/api/v1"
}
