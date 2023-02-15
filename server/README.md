# aws-lambda-s3
This folder includes everything needed to build the server: codes, deployment configs, scripts.

## Get started
Some steps might get lost after I building up this server.... For the 1st time deployment, you might need to run:
```bash
# initialize the sam build environment
sam init

# to config the stack name, region...
sam deploy --guided
```

## Todo List

- [ ] when upload an image, also generate a thumbnail image

## Commands

|script|description|
|---|---|
|`npm start`| start local server, mainly for experiment purpose |
|`npm run build`| build codes in container |
|`npm run build:typescript`| compile codes into CommonJS, used by docker build |
|`npm run deploy`| build the codes in container, and deploy to aws |

## References
[Sharp for AWS Lambda (with HEIC support)](https://github.com/zoellner/sharp-heic-lambda-layer)
[Using container image support for AWS Lambda with AWS SAM](https://aws.amazon.com/blogs/compute/using-container-image-support-for-aws-lambda-with-aws-sam/)
[Deploy Node.js Lambda functions with container images](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-image.html)