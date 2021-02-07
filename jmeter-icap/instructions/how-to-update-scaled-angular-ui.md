# Updating AWS Jmeter Test Engine Scaled Solution with Angular UI

## Introduction

This file explains how to update an existing installation of the project. The steps provided below should be completed in the same order they are listed.

## Prerequisites

1. The project should be installed, this can be done using the [Scaled Angular UI Component Install and Deploy Instructions](./scaled-angular-ui-component-install-and-deploy.md)

2. SSH access to the ICAPServer-Performance-Analytics-Dashboard EC2 machine will be needed

## Running the update_ui.sh Bash Script

The project comes bundled with a script that will update the current respository to the latest version. To run this script, SSH into the ICAPServer-Performance-Analytics-Dashboard EC2 instance and run the following two commands:

```
sudo chmod +x /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts/update_ui.sh
/opt/git/aws-jmeter-test-engine/jmeter-icap/scripts/update_ui.sh
```

After running these commands, wait for the process to complete. Once finished, the project will be up to date and ready to use.
