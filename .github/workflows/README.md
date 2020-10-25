# Setup github actions to run jmeter tests on AWS

## Authentication to AWS 

Workflows in Github Actions can authenticate to AWS using AWS credentails.

Github secrets should be used to store the AWS credentails.

The following secrets should be created in github secrets

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

Once the secrets are created, they can be used for authentication in the workflow using `actions/configure-aws-credentials@v1` action.

## Execute tests

Any steps followed by above authentication step will have access to AWS.

As we are using python to deploy the infrastructure to AWS and run the tests, we need to install python using `actions/setup-python@v1` action.

Once python is installed, we need to install necessary python packages such as `boto3` and run the create_stack.py python script to execute the tests.

The following secrets should be created in github secrets which are used by the python script:

- BUCKET: S3 bucket name used to store the scripts. No default value and the secret must be created.
- FILE_NAME: Script file name to be uploaded in the S3 bucket. No default value and the secret must be created.
- INFLUX_HOST: is the IP address or hostname of the Influx DB. Default value is 10.112.0.112
- ENDPOINT_URL: is the ICAP server URL. Default value is gw-icap-k8s-a0c293ac.hcp.uksouth.azmk8s.io
- TOTAL_USERS: is the total number of users for the test. Default value of this parameter is 20
- RAMP_UP: is the ramp up time. Default value is 20 seconds
- DURATION: is the duration of the test. Default value 900 seconds
- PREFIX: is the prefix used in the cloudformation stack name. Defualt value is "ga-"

## Schedule the workflow

The workflow is scheduled to run the tests every 30 minutes using a cron schedule for a duration of 15 mins.

## Delete the cloudformation stack

`Delete stack` workflow is also scheduled to run every 30 minutes.

This workflow fetches the list of cloudformation stacks with a given prefix which are created before past 30 minutes and deletes the stack.

## Create new workflow with different test scenarios

To run different test scenarios at a different schedules, make a copy of run_tests.yaml and delete_test_stack.yaml and follow below steps:

For run_tests.yaml file:

- Update the `name` to uniquely identify the test scenario.
- Update the `schedule` in the file as required using the cron syntax. Refer [this](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#schedule) documentation to learn about the syntax.
- Update `python3 create_stack.py` command with the necessary values of total users, ramp up time, duration of test run and pass a unique `--prefix` to uniquely identify the test scenario.

For delete_test_stack.yaml file:

- Update the schedule based on when the cloudformation stack should be deleted.
- Update `python3 delete_stack.py` command by passing a unique `--prefix` to uniquely identify the test scenario. This prefix should be same as the prefix passed in the above step.

## Stop a scheduled workflow

To stop a scheduled workflow, delete the schedule from the workflow yaml file and merge the changes into master. 

Only the latest schedule in the `main/master` branch are used for scheduling the workflow.

