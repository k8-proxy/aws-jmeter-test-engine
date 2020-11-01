from subprocess import run
from argparse import ArgumentParser
from math import ceil
import create_stack
from create_stack import Config

def __get_commandline_args():
    parser = ArgumentParser(fromfile_prefix_chars='@', description='Create cloudformation stack to deploy ASG. '
                                                                   'Create Grafana Dashboard for ICAP server metrics display.')
    parser.add_argument('--total_users', '-t', default=4000,
                        help='total number of users in the test (default: 4000)')

    parser.add_argument('--users_per_instance', '-u', default=4000,
                        help='number of users per instance (default: 4000)')

    parser.add_argument('--ramp_up', '-r', default=300,
                        help='ramp up time (default: 300)')

    parser.add_argument('--duration', '-d', default=900,
                        help='duration of test (default: 900)')

    parser.add_argument('--endpoint_url', '-e', default="gw-icap-k8s-a0c293ac.hcp.uksouth.azmk8s.io",
                        help='ICAP server endpoint URL (default: gw-icap-k8s-a0c293ac.hcp.uksouth.azmk8s.io)')

    parser.add_argument('--influx_host', '-i', default="10.112.0.112",
                        help='Influx DB host (default: 10.112.0.112)')

    parser.add_argument('--grafana_url', '-g',
                        type=str,
                        help='The URL to your grafana DB home',
                        default="10.112.0.112:3000")

    parser.add_argument('--grafana_key', '-k',
                        type=str,
                        help='API key to be used for dashboard creation in grafana database',
                        default="")

    parser.add_argument('--grafana_file', '-f',
                        type=str,
                        help='path to grafana template used for dashboard creation',
                        default="")

    parser.add_argument('--prefix', '-p', default="",
                        help='Prefix for Cloudformation stack name (default: "")')

    parser.add_argument('--test_data_file', default=Config.test_data_file,
                        help='Test data file')

    parser.add_argument('--jmx_script_name', default=Config.jmx_script_name,
                        help='JMX script name')

    parser.add_argument('--secret_id', default=Config.secret_id,
                        help='Secrets manager id to use')

    parser.add_argument('--region', default=Config.region,
                        help='AWS Region to use')
    
    return parser.parse_args()


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


def __exec_create_dashboard(cl_args, instances_required):
    duration = cl_args.duration
    total_users = cl_args.total_users
    endpoint_url = cl_args.endpoint_url
    grafana_file = cl_args.grafana_file
    grafana_api_key = cl_args.grafana_key
    grafana_url = cl_args.grafana_url
    prefix = cl_args.prefix
    # '-t', total_users, '-d', duration, '-e', endpoint_url,
    args = ['python3', 'create_dashboard.py', '-t', total_users, '-d', duration, '-e', endpoint_url, '-f', grafana_file,
            '-k', grafana_api_key, '-g', grafana_url, '-p', prefix,
            '-q', instances_required]
    
    run(args)


def __exec_create_stack(cl_args, instances_required, users_per_instance):

    Config.total_users = cl_args.total_users
    Config.users_per_instance = users_per_instance
    Config.ramp_up = cl_args.ramp_up
    Config.duration = cl_args.duration
    Config.endpoint_url = cl_args.endpoint_url
    Config.influx_host = cl_args.influx_host
    Config.prefix = cl_args.prefix
    Config.instances_required = instances_required
    Config.test_data_file = cl_args.test_data_file
    Config.jmx_script_name = cl_args.jmx_script_name
    Config.secret_id = cl_args.secret_id
    Config.region = cl_args.region

    create_stack.main(config=Config)


if __name__ == '__main__':
    arguments = __get_commandline_args()
    instances_required, users_per_instance = __calculate_instances_required(int(arguments.total_users),
                                                                            int(arguments.users_per_instance))
    print("Creating Load Generators...")
    __exec_create_stack(arguments, instances_required, users_per_instance)
    print("Creating dashboard...")
    __exec_create_dashboard(arguments, str(instances_required))
