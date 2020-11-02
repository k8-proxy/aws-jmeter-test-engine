import boto3
from datetime import timedelta, datetime, timezone
import os
import argparse
from create_stack import Config


def main():
    
    profile_name = Config.aws_profile_name
    parser = argparse.ArgumentParser(description='Create cloudformation stack to deploy ASG.')
    parser.add_argument('--prefix', '-p', default="ga",
                        help='Prefix for Cloudformation stack name (default: "ga-")')
    parser.add_argument('--min_age', '-m', default=30, type=int,
                        help='Minimum age of stack to delete in minutes (default: 30)')

    args = parser.parse_args()
    prefix = args.prefix + "-" if args.prefix not in  ["", None] else args.prefix
    min_age = args.min_age

    session = boto3.session.Session(profile_name=profile_name)
    client = session.client("cloudformation")

    now = datetime.now(timezone.utc)
    past_time = now - timedelta(minutes=min_age)
    stacks_list = client.list_stacks(StackStatusFilter=["CREATE_COMPLETE", "CREATE_FAILED"])

    print("finding the stack names with prefix %s" % prefix)
    for s in stacks_list["StackSummaries"]:
        stack_name = s["StackName"]
        if not stack_name.startswith(prefix + "aws-jmeter-test-engine-"):
            continue
        

        # This will delete stacks that are older than given age.
        creation_time = s["CreationTime"]
        if creation_time <= past_time:
            print("deleting stack %s"%(stack_name))
            client.delete_stack(StackName=stack_name)


if __name__ == "__main__":
    main()
