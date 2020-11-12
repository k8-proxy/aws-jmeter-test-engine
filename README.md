## Introduction
The AWS Performance Test Execution Framework is a custom built auto scalable solution that uses generated EC2 instances with a JMeter test module to simulate user traffic to the ICAP server

Overall, logical structure looks like this:

![vm_load_vision](jmeter-icap-poc/instructions/img/ICAPServer-Performance-Analytics-Dashboard.png)

In nutshell, user triggers python script to indicate what kind of load needs to be generated, then automation will take care of creating necessary EC2 instances that will trigger load and also it will create performance analytics dashboard automatically.

There are 2 AWS community images created in AWS Ireland region in order to make use of this performance test framework more easier

 - ICAPServer-Performance-Analytics-Dashboard - ami-039215eee67c4041e - this image is used to create Performance Dashboard automatically
 - ICAPServer-Performance-Load-Generator - ami-088f46d6d2a758a97 - this image is used during Load Generation triggering in EC2 Auto Scale Cloudformation script.

This document will show simple way to get started utilizing this framework step by step.

Before starting make sure to clone https://github.com/k8-proxy/aws-jmeter-test-engine.git this repo to your local machine. 

## How to get started?

# Step 1. VPC, Subnets & Security Groups creation. 

If there are no existing VPC and Subnets available then https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap-poc/cloudformation/AWS-CloudFormation-VPC-6-Subnets.json CloudFormation script can be used to create one.

* Create 2 security groups : 

1. Security group for Load Generators:  ICAP-Performance-LG-SG
2. Security group for Dashboard instance: ICAP-Performance-Dashboard-SG
    - Incoming rule: 
       - port 3000 - from your local IP
       - port 3100 - from load generator security group
       - port 8086 - from load generator security group

# Checking values in the Cloudformation Script

In your local copy of the repo it's worth checking a few things in the cloudformation script: https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap-poc/cloudformation/GenerateLoadGenerators.json

There are some existing resources that the script uses to generate the required instances

ami id - this is id from ICAPServer-Performance-Load-Generator AWS community image

sg - ICAP-Performance-LG-SG id

vpc - vpc id created above

sn - public subnet list created above

key pair name - your key pair name used to access AWS EC2 instances

AMI, Security Group, and Key Pair Name can all be found under the EC2 Service.
VPC and Subnet can be found under the VPC Service.

# Step 2. Setup Performance Dashboard system

Create new EC2 instance using ICAPServer-Performance-Analytics-Dashboard - ami-039215eee67c4041e image from AWS community. 

EC2 Instance type =t3.medium is sufficient for average use. 

if you do not wish to use ready image, rather create everything from scratch then follow these instructions:
https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap-poc/instructions/How-to-Install-InfluxDB-Grafana-Loki-on-Amazon-Linux.md

# Step 3. Create S3 bucket

Create private s3 bucket in AWS Ireland region (if you are going to use above ready images to generate load). The s3 bucket is used to store performance test scripts and data. 

# Step 4. Create AWS IAM Role with Access to AWS Secret Manager and to S3 bucket

Change "aws-testengine-s3" to your own bucket name and run https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap-poc/cloudformation/aws-secret-manager_with_-iam-role.json Cloudformation script.

# Step 5. Create IAM User with only programmatic read/write access to S3 and store access keys in AWS Secrets Manager.

This key is used to access s3 bucket where test data is.
Performance test Jmeter script expects that these keys are passed to it. 

1. Secret Key = Access key ID 
   Secret Value = Your access key here
2. Secret Key = Secret access key 
   Secret Value = Your Secret access key here

# Step 6. Create Grafana API key and store them in AWS Secrets Manager

Follow Prerequisites from https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap-poc/instructions/how-to-use-create_dashboards-script.md this link to create Grafana API key.

Store keys in AWS Secrets Manager using same steps as step 5.

Secret Key = Grafana_Api_Key
Secret Value = Your grafana api key value here

# Step 7. Run python script to trigger load

Next step, please, follow the following instructions to start the load:

https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap-poc/instructions/how-to-use-create_stack_dash.md







