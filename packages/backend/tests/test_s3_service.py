from unittest.mock import MagicMock, patch


def test_upload_to_s3_calls_put_object():
    from care_assistant.services.s3 import upload_to_s3

    mock_client = MagicMock()
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        upload_to_s3(b"file-content", "my-bucket", "prescriptions/p1/f1.pdf")
        mock_client.put_object.assert_called_once_with(
            Body=b"file-content", Bucket="my-bucket", Key="prescriptions/p1/f1.pdf"
        )


def test_download_from_s3_returns_bytes():
    from care_assistant.services.s3 import download_from_s3

    mock_client = MagicMock()
    mock_client.get_object.return_value = {"Body": MagicMock(read=lambda: b"file-bytes")}
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        result = download_from_s3("my-bucket", "prescriptions/p1/f1.pdf")
        assert result == b"file-bytes"
        mock_client.get_object.assert_called_once_with(
            Bucket="my-bucket", Key="prescriptions/p1/f1.pdf"
        )


def test_delete_from_s3_calls_delete_object():
    from care_assistant.services.s3 import delete_from_s3

    mock_client = MagicMock()
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        delete_from_s3("my-bucket", "prescriptions/p1/f1.pdf")
        mock_client.delete_object.assert_called_once_with(
            Bucket="my-bucket", Key="prescriptions/p1/f1.pdf"
        )


def test_generate_presigned_url_returns_url():
    from care_assistant.services.s3 import generate_presigned_url

    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://s3.example.com/key?sig=abc"
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        url = generate_presigned_url("my-bucket", "prescriptions/p1/f1.pdf")
        assert url == "https://s3.example.com/key?sig=abc"
        mock_client.generate_presigned_url.assert_called_once_with(
            "get_object",
            Params={"Bucket": "my-bucket", "Key": "prescriptions/p1/f1.pdf"},
            ExpiresIn=3600,
        )


def test_generate_presigned_url_custom_expiry():
    from care_assistant.services.s3 import generate_presigned_url

    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://s3.example.com/key?sig=xyz"
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        generate_presigned_url("my-bucket", "prescriptions/p1/f1.pdf", expiry_seconds=7200)
        mock_client.generate_presigned_url.assert_called_once_with(
            "get_object",
            Params={"Bucket": "my-bucket", "Key": "prescriptions/p1/f1.pdf"},
            ExpiresIn=7200,
        )
