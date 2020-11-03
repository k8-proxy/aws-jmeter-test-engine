# Setup github actions to run jmeter tests on AWS

## How to create new workflow with different test scenarios

To run different test scenarios at a different schedules, make a copy of run_tests.yaml and delete_test_stack.yaml and follow below steps:

For run_tests.yaml file:

- Update the `name` to uniquely identify the test scenario.
- Update the `schedule` in the file as required using the cron syntax. Refer [this](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#schedule) documentation to learn about the syntax.
- Update `python3 create_stack.py` command with the necessary values of total users, ramp up time, duration of test run and pass a unique `--prefix` to uniquely identify the test scenario.

For delete_test_stack.yaml file:

- Update the schedule based on when the cloudformation stack should be deleted.
- Update `python3 delete_stack.py` command by passing a unique `--prefix` to uniquely identify the test scenario. This prefix should be same as the prefix passed in the above step.

## Explaination of workflow

### Checkout the code from git

Use `actions/checkout@v1` action to checkout the code.

Example:

```
- name: Checkout
uses: actions/checkout@v1
```

### Authentication to AWS 

Workflows in Github Actions can authenticate to AWS using AWS credentails.

Github secrets should be used to store the AWS credentails.

The following secrets should be created in github secrets

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

Once the secrets are created, they can be used for authentication in the workflow using `actions/configure-aws-credentials@v1` action.

Example:

```
- name: Configure AWS credentials
uses: aws-actions/configure-aws-credentials@v1
with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: eu-west-1
```

### Execute tests

Any steps followed by above authentication step will have access to AWS.

As we are using python to deploy the infrastructure to AWS and run the tests, we need to install python using `actions/setup-python@v1` action.

Example:

```
- name: Set up Python 3.7
uses: actions/setup-python@v1
with:
    python-version: "3.7"
```

Once python is installed, we need to install necessary python packages such as `boto3 python-dotenv` and run the create_stack.py python script to execute the tests.

The following secrets can be created in github secrets which will override the default configurations used by the python script:

- SCRIPT_BUCKET: S3 bucket name used to store the scripts. No default value and the secret must be created.
- SCRIPT_NAME: Script file name to be uploaded in the S3 bucket. No default value and the secret must be created.
- TEST_DATA_BUCKET: S3 bucket which contains test files
- TEST_DATA_FILE: Test data file which contains files names to use for testing
- JMX_SCRIPT_NAME: JMX script used by the tests
- INFLUX_HOST: is the IP address or hostname of the Influx DB. Default value is 10.112.0.112
- ENDPOINT_URL: is the ICAP server URL. Default value is gw-icap-k8s-a0c293ac.hcp.uksouth.azmk8s.io
- TOTAL_USERS: is the total number of users for the test. Default value of this parameter is 20
- RAMP_UP: is the ramp up time. Default value is 20 seconds
- DURATION: is the duration of the test. Default value 900 seconds
- PREFIX: is the prefix used in the cloudformation stack name. Defualt value is "ga"

Example:

```
- name: Install required packages and run tests
run: |
    pip install boto3 python-dotenv
    cd jmeter-icap-poc/scripts
    cp config.env.sample config.env
    sed -i -e '/AWS_PROFILE_NAME/ { d; } ' config.env
    python3 create_stack.py
env:
    SCRIPT_BUCKET: ${{ secrets.SCRIPT_BUCKET }}
    SCRIPT_NAME: ${{ secrets.SCRIPT_NAME }}
    INFLUX_HOST: ${{ secrets.INFLUX_HOST }}
    ENDPOINT_URL: ${{ secrets.ENDPOINT_URL }}
    TOTAL_USERS: ${{ secrets.TOTAL_USERS }}
    RAMP_UP: ${{ secrets.RAMP_UP }}
    DURATION: ${{ secrets.DURATION }}
    PREFIX: ${{ secrets.PREFIX }}
    TEST_DATA_FILE: ${{ secrets.TEST_DATA_FILE }}
```

## Schedule the workflow

The `Run Tests` workflow is scheduled to run the tests every 30 minutes using a cron schedule for a duration of 15 mins.

## Delete the cloudformation stack

`Delete stack` workflow is also scheduled to run every 30 minutes.

This workflow fetches the list of cloudformation stacks with a given prefix which are created before past 30 minutes and deletes the stack.


## Stop a scheduled workflow

To stop a scheduled workflow, delete the schedule from the workflow yaml file and merge the changes into master. 

Only the latest schedule in the `main/master` branch are used for scheduling the workflow.

