from subprocess import run
from argparse import ArgumentParser
import time
from dotenv import load_dotenv
import os
from datetime import timedelta, datetime, timezone
from math import ceil
import create_dashboard
import delete_stack
import create_stack
from create_stack import Config

# Stacks are deleted duration + offset seconds after creation; should be set to 900.
DELETE_TIME_OFFSET = 900
# Interval between "time elapsed" messages sent to user; should be set to 600.
MESSAGE_INTERVAL = 600


# set all possible arguments/options that can be input into the script
def __get_commandline_args():
    parser = ArgumentParser(fromfile_prefix_chars='@', description='Create cloudformation stack to deploy ASG. '
                                                                   'Create Grafana Dashboard for ICAP server metrics display.')
    parser.add_argument('--total_users', '-t', default=Config.total_users,
                        help='total number of users in the test (default: 4000)')

    parser.add_argument('--users_per_instance', '-u', default=Config.users_per_instance,
                        help='number of users per instance (default: 4000)')

    parser.add_argument('--ramp_up', '-r', default=Config.ramp_up,
                        help='ramp up time (default: 300)')

    parser.add_argument('--duration', '-d', default=Config.duration,
                        help='duration of test (default: 900)')

    parser.add_argument('--endpoint_url', '-e', default=Config.endpoint_url,
                        help='ICAP server endpoint URL (default: gw-icap-k8s-a0c293ac.hcp.uksouth.azmk8s.io)')

    parser.add_argument('--influx_host', '-i', default=Config.influx_host,
                        help='Influx DB host (default: 10.112.0.112)')

    parser.add_argument('--grafana_url', '-g',
                        type=str,
                        help='The URL to your grafana DB home',
                        default=Config.grafana_url)

    parser.add_argument('--grafana_key', '-k',
                        type=str,
                        help='API key to be used for dashboard creation in grafana database',
                        default=Config.grafana_key)

    parser.add_argument('--grafana_file', '-f',
                        type=str,
                        help='path to grafana template used for dashboard creation',
                        default=Config.grafana_file)

    parser.add_argument('--prefix', '-p', default=Config.prefix,
                        help='Prefix for Cloudformation stack name (default: "")')

    parser.add_argument('--test_data_file', default=Config.test_data_file,
                        help='Test data file')

    parser.add_argument('--jmx_script_name', default=Config.jmx_script_name,
                        help='JMX script name')

    parser.add_argument('--secret_id', default=Config.secret_id,
                        help='Secrets manager id to use')

    parser.add_argument('--region', default=Config.region,
                        help='AWS Region to use')

    parser.add_argument('--exclude_dashboard', '-x', action='store_true',
                        help='Setting this option will prevent the creation of a new dashboard for this stack')

    parser.add_argument('--preserve_stack', '-s', action='store_true',
                        help='Setting this option will prevent the created stack from being automatically deleted.')

    parser.add_argument('--prefix_based_delete', '-pb', action='store_true',
                        help='Setting this option will cause stacks to be deleted based on prefix and time created.')

    parser.add_argument('--min_age', '-m', default=30, type=int,
                        help='Minimum age of stack to delete in minutes (default: 30)')

    return parser.parse_args()


# Calculates number of instances required, used with create_stack and create_dashboard for displaying that info
def __calculate_instances_required(total_users, users_per_instance):
    # calculate number of instances required
    instances_required = ceil(total_users / users_per_instance)
    if total_users <= users_per_instance:
        instances_required = 1
        users_per_instance = total_users
    else:
        i = 0
        while i < 5:
            if total_users % users_per_instance == 0:
                instances_required = int(total_users / users_per_instance)
                break
            else:
                if total_users % instances_required == 0:
                    users_per_instance = int(total_users / instances_required)
                else:
                    instances_required += 1
            i += 1

        if instances_required * users_per_instance != total_users:
            print("Please provide total_users in multiples of users_per_instance.")
            exit(0)

    return instances_required


# Starts the process of calling delete_stack after duration. Starts timer and displays messages updating users on status
def __start_delete_stack(additional_delay, config):
    duration = Config.duration
    total_wait_time = additional_delay + int(duration)
    minutes = total_wait_time / 60
    finish_time = datetime.now(timezone.utc) + timedelta(seconds=total_wait_time)
    start_time = datetime.now(timezone.utc)

    print("Stack will be deleted after {0:.1f} minutes".format(minutes))

    while datetime.now(timezone.utc) < finish_time:
        if datetime.now(timezone.utc) != start_time:
            diff = datetime.now(timezone.utc) - start_time
            print("{0:.1f} minutes have elapsed, stack will be deleted in {1:.1f} minutes".format(diff.seconds / 60, (
                    total_wait_time - diff.seconds) / 60))
        time.sleep(MESSAGE_INTERVAL)

    delete_stack.main(config)


def __get_stack_name(config):

    now = datetime.now()
    prefix = config.prefix
    date_suffix = now.strftime("%Y-%m-%d-%H-%M")
    if config.stack_name:
        created_stack_name = prefix + '-' + str(config.stack_name)
    else:
        created_stack_name = prefix + '-aws-jmeter-test-engine-' + date_suffix

    return created_stack_name


def main(config):

    print("Creating Load Generators...")
    create_stack.main(config)

    if config.exclude_dashboard:
        print("Dashboard will not be created")
    else:
        print("Creating dashboard...")
        create_dashboard.main(config)

    if config.preserve_stack:
        print("Stack will not be automatically deleted.")
    else:
        __start_delete_stack(DELETE_TIME_OFFSET, config)


if __name__ == "__main__":
    args = __get_commandline_args()

    # Get all argument values from Config.env file. Any command line args input manually will override config.env args.

    Config.total_users = int(args.total_users)
    Config.users_per_instance = int(args.users_per_instance)
    Config.instances_required = __calculate_instances_required(Config.total_users,
                                                               Config.users_per_instance)
    Config.ramp_up = args.ramp_up
    Config.duration = args.duration
    Config.endpoint_url = args.endpoint_url
    Config.influx_host = args.influx_host
    Config.prefix = args.prefix
    Config.test_data_file = args.test_data_file
    Config.jmx_script_name = args.jmx_script_name
    Config.secret_id = args.secret_id
    Config.region = args.region
    Config.min_age = args.min_age

    # these are flag/boolean arguments
    if args.exclude_dashboard:
        Config.exclude_dashboard = True
    elif Config.exclude_dashboard:
        Config.exclude_dashboard = int(Config.exclude_dashboard) == 1

    if args.preserve_stack:
        Config.preserve_stack = True
    elif Config.preserve_stack:
        Config.preserve_stack = int(Config.preserve_stack) == 1

    if args.prefix_based_delete:
        Config.prefix_based_delete = True
    elif Config.prefix_based_delete:
        Config.prefix_based_delete = int(Config.prefix_based_delete) == 1

    Config.stack_name = __get_stack_name(Config)

    main(Config)
