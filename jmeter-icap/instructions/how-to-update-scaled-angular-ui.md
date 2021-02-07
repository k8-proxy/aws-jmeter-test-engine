# Updating AWS Jmeter Test Engine Scaled Solution with Angular UI

## Introduction

This file explains how to update an existing installation of the project. The steps provided below should be completed in the same order they are listed.

## Prerequisites

1. The project should be installed, this can be done using the [Scaled Angular UI Component Install and Deploy Instructions](./scaled-angular-ui-component-install-and-deploy.md)

2. SSH access to the ICAPServer-Performance-Analytics-Dashboard EC2 machine will be needed

## Step 1: Pulling latest version of project from repository

To download the latest project files, SSH into the EC2 machine containing the project and use the following commands:
```
cd /opt/git/aws-jmeter-test-engine/
sudo git pull origin master
```

## Step 2: Install latest Angular Project Files and Deploy to Web Server
```
cd /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form
sudo npm install
sudo ng build --prod
sudo cp -a /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form/dist/master-script-form/. /var/www/html/
```

## Step 3: Run the ChangeIP Script
```
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
sudo ./changeIP.sh
```

## Step 4: Restart Services
```
sudo systemctl stop apache2.service
sudo systemctl start apache2.service
sudo systemctl stop flask_scaled.service
sudo systemctl start flask_scaled.service
```
