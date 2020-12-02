from argparse import ArgumentParser
import time
from datetime import timedelta, datetime, timezone
from math import ceil
import delete_stack
import create_stack
import create_dashboard
from create_stack import Config
from ec2_instance_manager import start_instance
from aws_secrets import get_secret_value

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

    parser.add_argument('--test_directory', '-td', default=Config.test_directory,
                        help='the directory containing test files and grafana templates')

    parser.add_argument('--ramp_up_time', '-r', default=Config.ramp_up_time,
                        help='ramp up time (default: 300)')

    parser.add_argument('--duration', '-d', default=Config.duration,
                        help='duration of test (default: 900)')

    parser.add_argument('--icap_endpoint_url', '-e', default=Config.icap_endpoint_url,
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

    parser.add_argument('--test_data_access_secret', default=Config.test_data_access_secret,
                        help='Secrets manager id to use')

    parser.add_argument('--region', default=Config.region,
                        help='AWS Region to use')

    parser.add_argument('--exclude_dashboard', '-x', action='store_true',
                        help='Setting this option will prevent the creation of a new dashboard for this stack')

    parser.add_argument('--preserve_stack', '-s', action='store_true',
                        help='Setting this option will prevent the created stack from being automatically deleted.')

    parser.add_argument('--min_age', '-m', default=Config.min_age, type=int,
                        help='Minimum age of stack to delete in minutes (default: 30)')

    parser.add_argument('--grafana_server_tag', '-tag', default=Config.grafana_server_tag,
                        help='Tag of server containing the Grafana database that will be started')

    parser.add_argument('--grafana_secret', '-gs', default=Config.grafana_secret,
                        help='The secret ID for the Grafana API Key stored in AWS Secrets')

    parser.add_argument('--icap_server_port', '-port', default=Config.icap_server_port,
                        help='Port of ICAP server used for testing')

    parser.add_argument('--tls_verification_method', '-tls', default=Config.tls_verification_method,
                        help='Verification method used with TLS')

    parser.add_argument('--enable_tls', '-et', default=Config.enable_tls,
                        help='Whether or not to enable TLS')


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

    return instances_required, users_per_instance


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

def __determineLoadType(load: str):
    if load == "Direct":
        print("Using direct")
        Config.test_directory = 'ICAP-Direct-File-Processing'
        Config.jmx_script_name = 'ICAP_Direct_FileProcessing_Local_v4.jmx'
        Config.grafana_file = 'aws-test-engine-dashboard.json'
        Config.test_data_file = 'gov_uk_files.csv'

    elif load == "Proxy":
        print("Using proxy")
        Config.test_directory = 'ICAP-Proxy-Site'
        Config.jmx_script_name = 'ProxySite_Processing_v1.jmx'
        Config.grafana_file = 'ProxySite_Dashboard_Template.json'
        Config.test_data_file = 'proxysitefiles.csv'

def main(config):
    dashboard_url = ''
    print("Creating Load Generators...")
    create_stack.main(config)

    if config.exclude_dashboard:
        print("Dashboard will not be created")
    else:
        print("Creating dashboard...")
        dashboard_url = create_dashboard.main(config)

    if config.preserve_stack:
        print("Stack will not be automatically deleted.")
    else:
        __start_delete_stack(DELETE_TIME_OFFSET, config)

    return dashboard_url

if __name__ == "__main__":
    args = __get_commandline_args()

    # Get all argument values from Config.env file. Any command line args input manually will override config.env args.

    Config.total_users = int(args.total_users)
    Config.users_per_instance = int(args.users_per_instance)
    Config.instances_required, Config.users_per_instance = __calculate_instances_required(Config.total_users, Config.users_per_instance)
    Config.ramp_up_time = args.ramp_up_time
    Config.duration = args.duration
    Config.icap_endpoint_url = args.icap_endpoint_url
    Config.influx_host = args.influx_host
    Config.prefix = args.prefix
    Config.test_data_file = args.test_data_file
    Config.jmx_script_name = args.jmx_script_name
    Config.test_data_access_secret = args.test_data_access_secret
    Config.region = args.region
    Config.grafana_url = args.grafana_url
    Config.min_age = args.min_age
    Config.grafana_server_tag = args.grafana_server_tag
    Config.test_directory = args.test_directory
    Config.grafana_file = args.grafana_file
    Config.icap_server_port = args.icap_server_port
    Config.tls_verification_method = args.tls_verification_method
    Config.enable_tls = args.enable_tls

    # these are flag/boolean arguments
    if args.exclude_dashboard:
        Config.exclude_dashboard = True
    elif Config.exclude_dashboard:
        Config.exclude_dashboard = int(Config.exclude_dashboard) == 1

    if args.preserve_stack:
        Config.preserve_stack = True
    elif Config.preserve_stack:
        Config.preserve_stack = int(Config.preserve_stack) == 1

    Config.stack_name = __get_stack_name(Config)

    # if Grafana custom IP was inserted via config, use it. Otherwise, start up the instance and use that IP instead.
    if not Config.grafana_url and not Config.grafana_server_tag:
        print("Must input either grafana_url or grafana_server_tags in config.env or using args")
        exit(0)
    elif not Config.grafana_url:
        ip = start_instance(Config)
        Config.grafana_url = 'http://{0}:3000'.format(ip)
        print(Config.grafana_url)

    # if Grafana secret key is inserted via config, use it. Otherwise, get grafana key from AWS secrets using grafana_secret_id
    if not Config.grafana_key and not Config.grafana_secret:
        print("Must input either grafana_key or grafana_secret_id in config.env or using args")
        exit(0)
    elif not Config.grafana_key and not Config.exclude_dashboard:
        secret_response = get_secret_value(config=Config, secret_id=Config.grafana_secret)
        secret_val = next(iter(secret_response.values()))
        Config.grafana_key = secret_val
        if secret_val:
            print("Grafana secret key retrieved.")

    main(Config)
