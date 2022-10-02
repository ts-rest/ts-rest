resource "aws_route53_zone" "main" {
  name         = "ts-rest.com"
}

resource "aws_route53_record" "cf_dns" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "ts-rest.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cf_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.cf_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}