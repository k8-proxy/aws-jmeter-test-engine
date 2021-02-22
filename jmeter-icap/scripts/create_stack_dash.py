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
from ui_tasks import set_config_from_ui, LoadType
from threading import Thread
from database_ops import database_insert_test
from metrics import InfluxDBMetrics

import uuid

# Stacks are deleted duration + offset seconds after creation; should be set to 900.
DELETE_TIME_OFFSET = 900

# Interval for how often "time elapsed" messages are displayed for delete stack process
MESSAGE_INTERVAL = 600

# set of stack names for currently running tests, used for preventing manually stopped tests from being added to influxdb
running_tests = set()

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

    parser.add_argument('--store_results', '-sr', action='store_true',
                        help='Setting this option will cause all test runs to be recorded into influxdb')

    parser.add_argument('--load_type', '-lt', default=Config.load_type,
                        help='Type of load to be generated (direct or proxy)')

    parser.add_argument('--use_iam_role', '-ir', default=Config.use_iam_role,
                        help='Whether or not to use IAM role for authentication')

    parser.add_argument('--sharepoint_proxy_ip', '-spip', default=Config.sharepoint_proxy_ip,
                        help='Sharepoint Proxy IP address')

    parser.add_argument('--sharepoint_host_names', '-sph', default=Config.sharepoint_host_names,
                        help='Hostnames to use with SharePoint')

    parser.add_argument('--tenant_id', '-tid', default=Config.tenant_id,
                        help='Sharepoint Tenant ID value')

    parser.add_argument('--client_id', '-cid', default=Config.client_id,
                        help='Sharepoint Client ID value')

    parser.add_argument('--client_secret', '-cs', default=Config.client_secret,
                        help='Sharepoint Client Secret')

    parser.add_argument('--influx_public_ip', '-ipip', default=Config.influx_public_ip,
                        help='Public IP of influxDB instance, used with functions that store/read test results')

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
    total_wait_time = additional_delay + int(config.duration)
    minutes = total_wait_time / 60
    finish_time = datetime.now(timezone.utc) + timedelta(seconds=total_wait_time)
    start_time = datetime.now(timezone.utc)

    print("Stack will be deleted after {0:.1f} minutes".format(minutes))

    while datetime.now(timezone.utc) < finish_time:
        if datetime.now(timezone.utc) != start_time and datetime.now(timezone.utc) + timedelta(seconds=MESSAGE_INTERVAL) < finish_time:
            diff = datetime.now(timezone.utc) - start_time
            print("{0:.1f} minutes have elapsed, stack will be deleted in {1:.1f} minutes".format(diff.seconds / 60, (
                    total_wait_time - diff.seconds) / 60))
            time.sleep(MESSAGE_INTERVAL)

    delete_stack.main(config)
    

def create_stack_from_ui(json_params, ova=False):
    ui_config = Config()
    set_config_from_ui(ui_config, json_params, ova=ova)
    (instances_required, users_per_instance) = __calculate_instances_required(ui_config.total_users, ui_config.users_per_instance)
    ui_config.users_per_instance = users_per_instance
    ui_config.instances_required = instances_required
    set_grafana_key_and_url(ui_config)
    ui_config.min_age = 0
    print("Creating Load Generators...")
    stack_name = create_stack.main(ui_config)
    ui_config.stack_name = stack_name

    print("Creating dashboard...")
    dashboard_url, grafana_uid = create_dashboard.main(ui_config, from_ui=True)

    delete_stack_thread = Thread(target=__start_delete_stack, args=(0, ui_config))
    delete_stack_thread.start()

    running_tests.add(stack_name)
    results_analysis_thread = Thread(target=store_and_analyze_after_duration, args=(ui_config, grafana_uid))
    results_analysis_thread.start()

    return dashboard_url, stack_name


def store_and_analyze_after_duration(config, grafana_uid, additional_delay=0, ova=False):
    InfluxDBMetrics.hostname = config.influx_public_ip if config.influx_public_ip not in ["", None] else config.influx_host
    InfluxDBMetrics.hostport = config.influx_port
    InfluxDBMetrics.init()

    total_wait_time = additional_delay + int(config.duration)
    start_time = datetime.now(timezone.utc)
    final_time = start_time + timedelta(seconds=total_wait_time)
    first_point = second_point = start_time

    while datetime.now(timezone.utc) < final_time:
        time.sleep(1)
        first_point = second_point
        second_point = datetime.now(timezone.utc)
        InfluxDBMetrics.save_statistics(config.load_type, config.prefix, first_point, second_point)

    run_id = uuid.uuid4()

    if config.store_results not in ["", None] and bool(int(config.store_results)) and (config.stack_name in running_tests or ova):
        print("test completed, storing results to the database")
        database_insert_test(config, run_id, grafana_uid, start_time, final_time)
        if not ova:
            running_tests.remove(config.stack_name)


def delete_stack_from_ui(stack_name):
    ui_config = Config()
    ui_config.stack_name = stack_name
    ui_config.min_age = 0
    delete_stack.main(ui_config)
    running_tests.remove(stack_name)


def main(config):
    dashboard_url = ''
    grafana_uid = ''
    print("Creating Load Generators...")
    stack_name = create_stack.main(config)
    config.stack_name = stack_name

    if config.exclude_dashboard:
        print("Dashboard will not be created")
    else:
        print("Creating dashboard...")
        dashboard_url, grafana_uid = create_dashboard.main(config)

    if config.preserve_stack:
        print("Stack will not be automatically deleted.")
    else:
        delete_stack_thread = Thread(target=__start_delete_stack, args=(DELETE_TIME_OFFSET, config))
        delete_stack_thread.start()

    if config.store_results:
        analyzer_thread = Thread(target=store_and_analyze_after_duration, args=(config, grafana_uid))
        analyzer_thread.start()

    return dashboard_url, stack_name


def set_grafana_key_and_url(config):
    # if Grafana custom IP was inserted via config, use it. Otherwise, start up the instance and use that IP instead.
    if not config.grafana_url and not config.grafana_server_tag:
        print("Must input either grafana_url or grafana_server_tags in config.env or using args")
        exit(0)
    elif not config.grafana_url:
        ip = start_instance(config)
        config.grafana_url = 'http://{0}:3000'.format(ip)
        print(config.grafana_url)

    # if Grafana secret key is inserted via config, use it. Otherwise, get grafana key from AWS secrets using grafana_secret_id
    if not config.grafana_key and not config.grafana_secret:
        print("Must input either grafana_key or grafana_secret_id in config.env or using args")
        exit(0)
    elif not config.grafana_key and not config.exclude_dashboard:
        secret_response = get_secret_value(config=config, secret_id=config.grafana_secret)
        secret_val = next(iter(secret_response.values()))
        config.grafana_key = secret_val
        if secret_val:
            print("Grafana secret key retrieved.")


def adjust_load_type_from_input(config):

    if config.load_type in ["", None]:
        return

    if str(config.load_type).lower() in ["proxy", "proxy offline"]:
        config.load_type = LoadType.proxy.value
    elif str(config.load_type).lower() in ["sharepoint", "proxy sharepoint"]:
        config.load_type = LoadType.proxy_sharepoint.value


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
    Config.influx_public_ip = args.influx_public_ip
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
    Config.load_type = args.load_type
    adjust_load_type_from_input(Config)
    Config.use_iam_role = args.use_iam_role
    Config.sharepoint_proxy_ip = args.sharepoint_proxy_ip
    Config.sharepoint_host_names = args.sharepoint_host_names
    Config.tenant_id = args.tenant_id
    Config.client_id = args.client_id
    Config.client_secret = args.client_secret

    # these are flag/boolean arguments
    if args.exclude_dashboard:
        Config.exclude_dashboard = True
    elif Config.exclude_dashboard:
        Config.exclude_dashboard = int(Config.exclude_dashboard) == 1

    if args.preserve_stack:
        Config.preserve_stack = True
    elif Config.preserve_stack:
        Config.preserve_stack = int(Config.preserve_stack) == 1

    if args.store_results:
        Config.store_results = True
    elif Config.store_results:
        Config.store_results = int(Config.store_results) == 1

    set_grafana_key_and_url(Config)

    main(Config)
