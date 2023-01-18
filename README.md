# Personal Photo Gallery with AWS s3

This is a project to display and upload my kid's photo by using aws s3.

## Remain Problems
- push photos from daycare app
- How to upload .HEIC file?
- upload video
- How to load photos by pagination (UI)?
- auto refresh list after upload
- rate limiting
- Language switch
- how to retrieve private photos by not using pre-signed URL? Using [Signed Cookies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-cookies.html) looks a better choice.

# Reference
[S3 presigned URLs with SAM](https://github.com/aws-samples/amazon-s3-presigned-urls-aws-sam)
[Use an Amazon CloudFront distribution to serve a static website](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/getting-started-cloudfront-overview.html)
[Using high-level (s3) commands with the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-services-s3-commands.html)
[@aws-sdk/cloudfront-signer](https://github.com/aws/aws-sdk-js-v3/tree/main/packages/cloudfront-signer)
[AWS SAM template anatomy](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy.html)
[Protecting your API using Amazon API Gateway and AWS WAF](https://aws.amazon.com/blogs/compute/protecting-your-api-using-amazon-api-gateway-and-aws-waf-part-i/)