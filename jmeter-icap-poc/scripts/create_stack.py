#!/usr/bin/env python
# coding: utf-8

import boto3
import argparse
from datetime import datetime
import re
import os
from dotenv import load_dotenv


class Config(object):
    # Load configuration
    load_dotenv(dotenv_path="./config.env")
    try:
        aws_profile_name = os.getenv("AWS_PROFILE_NAME")
        region = os.getenv("REGION")
        script_bucket = os.getenv("SCRIPT_BUCKET")
        script_name = os.getenv("SCRIPT_NAME")
        test_data_bucket = os.getenv("TEST_DATA_BUCKET")
        test_data_file = os.getenv("TEST_DATA_FILE")
        jmx_script_name = os.getenv("JMX_SCRIPT_NAME")
        secret_id = os.getenv("SECRET_ID")
        total_users = int(os.getenv("TOTAL_USERS"))
        users_per_instance = int(os.getenv("USERS_PER_INSTANCE"))
        instances_required = int(os.getenv("INSTANCES_REQUIRED"))
        ramp_up = os.getenv("RAMP_UP")
        duration = os.getenv("DURATION")
        endpoint_url = os.getenv("ENDPOINT_URL")
        influx_host = os.getenv("INFLUX_HOST")
        prefix = os.getenv("PREFIX")
        grafana_url = os.getenv("GRAFANA_URL")
        grafana_key = os.getenv("GRAFANA_KEY")
        grafana_file = os.getenv("GRAFANA_FILE")
        exclude_dashboard = os.getenv("EXCLUDE_DASHBOARD")
        preserve_stack = os.getenv("PRESERVE_STACK")
        prefix_based_delete = os.getenv("PREFIX_BASED_DELETE")
        min_age = os.getenv("MIN_AGE")
        stack_name = os.getenv("STACK_NAME")
    except Exception as e:
        print(
            "Please create config.env file similar to config.env.sample or set environment variables for all variables in config.env.sample file")
        print(str(e))
        raise


def get_size(users_per_instance):
    # Determine the size of ec2 instance and jvm memory
    instance_type = "m4.2xlarge"
    jvm_memory = "9216m"
    if 0 < users_per_instance < 1000:
        instance_type = "m4.large"
        jvm_memory = "3072m"
    elif 1000 <= users_per_instance < 2500:
        instance_type = "m4.xlarge"
        jvm_memory = "4096m"
    elif 2500 <= users_per_instance:
        instance_type = "m4.2xlarge"
        jvm_memory = "9216m"

    return instance_type, jvm_memory


def main(config):
    # Authenticate to aws
    profile = config.aws_profile_name
    session = boto3.session.Session(profile_name=profile)
    client = session.client('cloudformation')

    file_name = config.script_name
    instance_type, jvm_memory = get_size(config.users_per_instance)

    # write the script to s3 bucket after updating the parameters
    with open("StartExecution.sh") as f:
        script_data = f.read()

    script_data = re.sub("-Jp_vuserCount=[0-9]*", "-Jp_vuserCount=" + str(config.users_per_instance), script_data)
    script_data = re.sub("-Jp_rampup=[0-9]*", "-Jp_rampup=" + str(config.ramp_up), script_data)
    script_data = re.sub("-Jp_duration=[0-9]*", "-Jp_duration=" + str(config.duration), script_data)
    script_data = re.sub("-Jp_url=[a-zA-Z0-9\-\.]*", "-Jp_url=" + str(config.endpoint_url), script_data)
    script_data = re.sub("Xms[0-9]*m", "Xms" + str(jvm_memory), script_data)
    script_data = re.sub("Xmx[0-9]*m", "Xmx" + str(jvm_memory), script_data)
    script_data = re.sub("-Jp_influxHost=[a-zA-Z0-9\.]*", "-Jp_influxHost=" + config.influx_host, script_data)
    script_data = re.sub("-Jp_prefix=[A-Za-z0-9_\-]*", "-Jp_prefix=" + config.prefix, script_data)
    script_data = re.sub("SCRIPT_BUCKET=[A-Za-z0-9_\-]*", "SCRIPT_BUCKET=" + config.script_bucket, script_data)
    script_data = re.sub("TEST_DATA_BUCKET=[A-Za-z0-9_\-]*", "TEST_DATA_BUCKET=" + config.test_data_bucket, script_data)
    script_data = re.sub("DATA_FILE=[A-Za-z0-9_\-\.]*", "DATA_FILE=" + config.test_data_file, script_data)
    script_data = re.sub("SCRIPT=[A-Za-z0-9_\-\.]*", "SCRIPT=" + config.jmx_script_name, script_data)
    script_data = re.sub("SECRET_ID=[A-Za-z0-9_\-]*", "SECRET_ID=" + config.secret_id, script_data)
    script_data = re.sub("REGION=[A-Za-z0-9_\-]*", "REGION=" + config.region, script_data)

    s3_client = session.client('s3')
    s3_client.put_object(Bucket=config.script_bucket,
                         Body=script_data,
                         Key=file_name)
    
    # upload jmx script and test data file to S3
    print("Uploading jmx script and test data file to S3")
    with open(config.jmx_script_name, 'rb') as data:
        s3_client.upload_fileobj(data, config.script_bucket ,"script/" + config.jmx_script_name)

    with open(config.test_data_file, 'rb') as data:
        s3_client.upload_fileobj(data, config.script_bucket, "script/" + config.test_data_file)

    # Load cloudformation template
    with open("../cloudformation/GenerateLoadGenerators.json", "r") as f:
        asg_template_body = f.read()

    # create ASG with instances to run jmeter tests
    now = datetime.now()
    date_suffix = now.strftime("%Y-%m-%d-%H-%M")
    prefix = config.prefix + "-" if config.prefix not in ["", None] else config.prefix
    stack_name = prefix + 'aws-jmeter-test-engine-' + date_suffix
    asg_name = prefix + "LoadTest-" + date_suffix

    print("Deploying %s instances in the ASG by creating %s cloudformation stack" % (
    str(config.instances_required), stack_name))
    client.create_stack(
        StackName=stack_name,
        TemplateBody=asg_template_body,
        Parameters=[
            {
                "ParameterKey": "MinInstances",
                "ParameterValue": str(config.instances_required)
            },
            {
                "ParameterKey": "MaxInstances",
                "ParameterValue": str(config.instances_required)
            },
            {
                "ParameterKey": "AsgName",
                "ParameterValue": asg_name
            },
            {
                "ParameterKey": "InstanceType",
                "ParameterValue": instance_type
            }
        ]
    )
    print("Stack created with the following properties:\nTotal Users: %d\nDuration: %s\nEndpoint URL: %s" % (
    config.total_users, config.duration, config.endpoint_url))

if __name__ == "__main__":

    parser = argparse.ArgumentParser(fromfile_prefix_chars='@', description='Create cloudformation stack to deploy ASG.')
    parser.add_argument('--total_users', '-t', default=Config.total_users,
                        help='total number of users in the test (default: 4000)')

    parser.add_argument('--users_per_instance', '-u', default=Config.users_per_instance,
                        help='number of users per instance (default: 4000)')

    parser.add_argument('--ramp_up', '-r', default=Config.ramp_up,
                        help='ramp up time (default: 300)')

    parser.add_argument('--duration', '-d', default=Config.duration,
                        help='duration of test (default: 900)')

    parser.add_argument('--endpoint_url', '-e', default=Config.endpoint_url,
                        help=f'ICAP server endpoint URL (default: {Config.endpoint_url})')

    parser.add_argument('--influx_host', '-i', default=Config.influx_host,
                        help=f'Influx DB host (default: {Config.influx_host})')

    parser.add_argument('--prefix', '-p', default=Config.prefix,
                        help=f'Prefix for Cloudformation stack name, jmx and grafana dashboard (default: {Config.prefix})')

    parser.add_argument('--instances_required', '-q', default=Config.instances_required,
                        help='Number of instances required, needed to modify Grafana JSON')

    parser.add_argument('--test_data_file', default=Config.test_data_file,
                        help='Test data file')

    parser.add_argument('--jmx_script_name', default=Config.jmx_script_name,
                        help='JMX script name')

    parser.add_argument('--secret_id', default=Config.secret_id,
                        help='Secrets manager id to use')

    parser.add_argument('--region', default=Config.region,
                        help='AWS Region to use')

    args = parser.parse_args()

    Config.total_users = int(args.total_users)
    Config.users_per_instance = int(args.users_per_instance)
    Config.instances_required = int(args.instances_required)
    Config.ramp_up = args.ramp_up
    Config.duration = args.duration
    Config.endpoint_url = args.endpoint_url
    Config.influx_host = args.influx_host
    Config.prefix = args.prefix
    Config.test_data_file = args.test_data_file
    Config.jmx_script_name = args.jmx_script_name
    Config.secret_id = args.secret_id
    Config.region = args.region

    main(Config)
