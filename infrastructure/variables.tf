variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "s3_bucket_name" {
  description = "Globally unique name for the S3 uploads bucket"
  type        = string
}

variable "key_name" {
  description = "Name for the EC2 key pair resource in AWS"
  type        = string
}

variable "public_key_path" {
  description = "Local filesystem path to the SSH public key to register with AWS"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "github_repo" {
  description = "HTTPS GitHub URL to clone onto the EC2 instance (e.g. https://github.com/org/care-assistant.git)"
  type        = string
}
