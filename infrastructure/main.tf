terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region  = "eu-west-2"
}

resource "aws_s3_bucket" "ts-rest-docs-bucket" {
  bucket = "ts-rest-docs-bucket"

  tags = {
    Name = "ts-rest-docs-bucket"
  }

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "block_public_access" {
  bucket = aws_s3_bucket.ts-rest-docs-bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}


data "aws_iam_policy_document" "docs_app_s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.ts-rest-docs-bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "docs_app_bucket_policy" {
  bucket = aws_s3_bucket.ts-rest-docs-bucket.id
  policy = data.aws_iam_policy_document.docs_app_s3_policy.json
}