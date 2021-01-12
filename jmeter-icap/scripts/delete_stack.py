import boto3
from datetime import timedelta, datetime, timezone
from create_stack import Config


def main(config):
    profile_name = config.aws_profile_name

    prefix = config.prefix + "-" if config.prefix not in ["", None] else config.prefix
    min_age = int(config.min_age)
    stack_name = config.stack_name if stack_name_override == '' else stack_name_override
    if config.use_iam_role == "yes":
        session = boto3.session.Session(region_name=config.region)
    else:
        session = boto3.session.Session(profile_name=profile_name, region_name=config.region)
    client = session.client("cloudformation")

    now = datetime.now(timezone.utc)
    past_time = now - timedelta(minutes=min_age)
    stacks_list = client.list_stacks(StackStatusFilter=["CREATE_COMPLETE", "CREATE_FAILED", "ROLLBACK_COMPLETE"])

    if config.stack_name in [None, ""]:
        print("finding the stack names with prefix %s" % prefix)
        for s in stacks_list["StackSummaries"]:
            stack_name = s["StackName"]
            if not stack_name.startswith(prefix + "aws-jmeter-test-engine-"):
                continue

            # This will delete stacks that are older than given age.
            creation_time = s["CreationTime"]
            if creation_time <= past_time:
                print("deleting stack %s" % (stack_name))
                client.delete_stack(StackName=stack_name)

    else:
        print("deleting stack named: %s" % (stack_name))
        client.delete_stack(StackName=stack_name)


if __name__ == "__main__":
    main(Config)
