import boto3


def upload_to_s3(file_bytes: bytes, bucket: str, key: str) -> None:
    """Upload bytes to S3 at the given key."""
    boto3.client("s3").put_object(Body=file_bytes, Bucket=bucket, Key=key)


def download_from_s3(bucket: str, key: str) -> bytes:
    """Download an object from S3 and return its bytes."""
    response = boto3.client("s3").get_object(Bucket=bucket, Key=key)
    return response["Body"].read()


def delete_from_s3(bucket: str, key: str) -> None:
    """Delete an object from S3."""
    boto3.client("s3").delete_object(Bucket=bucket, Key=key)


def generate_presigned_url(bucket: str, key: str, expiry_seconds: int = 3600) -> str:
    """Generate a time-limited pre-signed GET URL for an S3 object."""
    return boto3.client("s3").generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expiry_seconds,
    )
