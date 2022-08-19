# Clinic REST-API
Using

- Node.js
- AWS Lambda
- AWS API Gateway
- AWS DynamoDB
- AWS CodePipeline
- AWS CodeBuild
- AWS IAM
- Github

See [Postman Collection](https://www.pantsbuild.org/docs) for Invoke API

Architectural Diagram

![Architectural Diagram](resources/architecture-diagram.png)

# Create Lambda functions

Create 4 Lambda functions with permisson with DynamoDB

![Architectural Diagram](resources/lambda.jpg)

Add following permisson to IAM Role
- AmazonDynamoDBFullAccess	
- CloudWatchLogsFullAccess

# Create API Gateway

Create AWS API GAteway and add following routes
![API Gateway](#)

# Create DynamoDB Tables

Create 4 dynamodb tables for
- user
- admin
- doctor
- appointments

![DynamoDB Tables](#)

## Create AWS CodeBuild Build Project

For CICD pipeline create a CodeBuild Project
![AWS CodeBuild](resources/codebuild.jpg)

CodeBuild Service role add following code part
```
{
  "Effect": "Allow",
  "Action": [
      "lambda:AddPermission",
      "lambda:RemovePermission",
      "lambda:CreateAlias",
      "lambda:UpdateAlias",
      "lambda:DeleteAlias",
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration",
      "lambda:PutFunctionConcurrency",
      "lambda:DeleteFunctionConcurrency",
      "lambda:PublishVersion"
  ],
  "Resource": [
    "arn:aws:lambda:{{region}}:{{accountno}}:function:{{user-bucket}}",
    "arn:aws:lambda:{{region}}:{{accountno}}:function:{{admin-bucket}}",
    "arn:aws:lambda:{{region}}:{{accountno}}:function:{{doctor-bucket}}",
    "arn:aws:lambda:{{region}}:{{accountno}}:function:{{appointment-bucket}}"
]
}
```
Create buildspec.yml, add content and push to repository

# Create CodePipeline

Create AWS CodePipeline for CICD process
![AWS CodePipeline](resources/codepipeline.jpg)

# Deploy API Gateway stage

We can create 4 stages for Dev, QA, UAT, Prod

![API Gateway](#)

# Check API using Postman or Curl

![Postman](#)

curl {{Invoke-URL}}
![Curl](#)

You can add Postman collection [Postman Collection](https://www.pantsbuild.org/docs)

Thank You!