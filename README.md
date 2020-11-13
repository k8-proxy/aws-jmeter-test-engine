## Introduction
The AWS Performance Test Execution Framework is a custom built auto scalable solution that uses generated EC2 instances with a JMeter test module to simulate user traffic to the ICAP server

Overall, logical structure looks like this:

![vm_load_vision](jmeter-icap/instructions/img/ICAPServer-Performance-Analytics-Dashboard.png)

In nutshell, user triggers python script to indicate what kind of load needs to be generated, then automation will take care of creating necessary EC2 instances that will trigger load and also it will create performance analytics dashboard automatically.

There are 2 AWS community images created in AWS Ireland region in order to make use of this performance test framework more easier

 - ICAPServer-Performance-Analytics-Dashboard - ami-039215eee67c4041e - this image is used to create Performance Dashboard automatically
 - ICAPServer-Performance-Load-Generator - ami-088f46d6d2a758a97 - this image is used during Load Generation triggering in EC2 Auto Scale Cloudformation script.

This document will show simple way to get started utilizing this framework step by step.

Before starting 
- Make sure to clone https://github.com/k8-proxy/aws-jmeter-test-engine.git this repo to your local machine. 
- Ensure that you have write access to VPC, Subnets, EC2, Security Group, S3, IAM Role, CloudFormation and Secrets Manager services in AWS.

## How to get started?

# Step 1. VPC, Subnets & Security Groups creation. 
![vm_load_vision](jmeter-icap/instructions/img/Step1.png)

**Create VPC and Subnets if non existent**

If there are no existing VPC and Subnets available then https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/cloudformation/AWS-CloudFormation-VPC-6-Subnets.json CloudFormation script can be used to create one.

**Create 2 security groups** : 

1. Security group for Load Generators:  ICAP-Performance-LG-SG
2. Security group for Dashboard instance: ICAP-Performance-Dashboard-SG
    - Incoming rule: 
       - port 3000 - from your local IP
       - port 3100 - from load generator security group
       - port 8086 - from load generator security group

**Checking & replacing values in the GenerateLoadGenerators.json script**

In your local copy of the repo it's worth checking a few things in the cloudformation script: https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/cloudformation/GenerateLoadGenerators.json

**Replace & save the following parameters with your own value**:

- VpcId - vpc id created above

- SubnetIds -public subnets ids list created above

- KeyPairName - your key pair name used to access AWS EC2 instances. If you do not have one, it can be created from AWS console.

- AmiImage - this is id (ami-088f46d6d2a758a97) from ICAPServer-Performance-Load-Generator AWS community image

- InstanceSecurityGroup - ICAP-Performance-LG-SG (created above) security group id

AMI, Security Group, and Key Pair Name can all be found under the EC2 Service.
VPC and Subnets can be found under the VPC Service.

# Step 2. Setup Performance Dashboard system

Create new EC2 instance using ICAPServer-Performance-Analytics-Dashboard - ami-039215eee67c4041e image from AWS community using the following steps:

- Click on Launch Instance
- Type "icapserver" in search field & click enter
- Click on "Community AMIs"
- Select "ICAPServer-Performance-Analytics-Dashboard" AMI
- Select t3.medium (for average use) instance type
- Select desired VPC and public subnet (created in step1, or existing own one can be used)
- Auto Assign Public IP & leave all other options as default
- Click Add Storage, then Click Add Tags : Create Name tag to identify your instance
- Next Configure security group: Select ICAP-Performance-Dashboard-SG created in step 1
- Review & Launch. Select your own keypair or create new one.
- Open Browser and enter http://[instance public ip]:3000
- Grafana ui opens and login with username/password: admin/glasswall

If you do not wish to use ready image, rather create everything from scratch then follow these instructions:
https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/instructions/How-to-Install-InfluxDB-Grafana-Loki-on-Amazon-Linux.md

# Step 3. Create S3 bucket

Create private s3 bucket in AWS Ireland region (if you are going to use above ready images to generate load). The s3 bucket is used to store performance test scripts and data. 

# Step 4. Create AWS IAM Role with Access to AWS Secret Manager and to S3 bucket

Change "aws-testengine-s3" to your own bucket name and run https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/cloudformation/aws-secret-manager_with_-iam-role.json Cloudformation script.

# Step 5. Create IAM User with only programmatic read/write access to S3 and store access keys in AWS Secrets Manager.

This key is used to access s3 bucket where test data is.
Performance test Jmeter script expects that these keys are passed to it. 

1. Secret Key = Access key ID 
   Secret Value = Your access key here
2. Secret Key = Secret access key 
   Secret Value = Your Secret access key here

# Step 6. Create Grafana API key and store them in AWS Secrets Manager

Follow Prerequisites from https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/instructions/how-to-use-create_dashboards-script.md this link to create Grafana API key.

Store keys in AWS Secrets Manager using same steps as step 5.

Secret Key = Grafana_Api_Key
Secret Value = Your grafana api key value here

# Step 7. Run python script to trigger load

Next step, please, follow the following instructions to start the load:

https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/instructions/how-to-use-create_stack_dash.md







