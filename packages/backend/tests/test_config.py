def test_config_has_s3_bucket_setting():
    from care_assistant.config import settings
    assert hasattr(settings, "aws_s3_bucket")
    assert settings.aws_s3_bucket == ""  # empty string default


def test_config_has_aws_region_setting():
    from care_assistant.config import settings
    assert hasattr(settings, "aws_region")
    assert settings.aws_region == "us-east-1"
