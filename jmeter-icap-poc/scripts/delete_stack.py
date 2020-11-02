import boto3
from datetime import timedelta, datetime, timezone
import os
import argparse


def get_configuration(key):
    # Load configuration
    try:

        if os.path.exists("config.env"):
            with open("config.env") as f:
                config = f.readlines()
            configuration = dict(c.strip().split("=") for c in config)
            return configuration.get(key)
        else:
            return os.getenv(key.upper())
    except Exception as e:
        print("Please create config.env file similar to config.env.sample or set environment variables for all variables in config.env.sample file")
        print(str(e))
        raise


def main():
    profile_name = get_configuration("aws_profile_name")
    parser = argparse.ArgumentParser(description='Create cloudformation stack to deploy ASG.')
    parser.add_argument('--prefix', '-p', default="ga-",
                        help='Prefix for Cloudformation stack name (default: "ga-")')

    args = parser.parse_args()
    prefix = args.prefix

    session = boto3.session.Session(profile_name=profile_name)
    client = session.client("cloudformation")

    stacks_list = client.list_stacks(StackStatusFilter=["CREATE_COMPLETE", "CREATE_FAILED"])

    print("finding the stack names with prefix %s" % prefix)
    for s in stacks_list["StackSummaries"]:
        stack_name = s["StackName"]
        if not stack_name.startswith(prefix + "aws-jmeter-test-engine-"):
            continue

        print("deleting stack %s" % (stack_name))
        client.delete_stack(StackName=stack_name)


if __name__ == "__main__":
    main()
