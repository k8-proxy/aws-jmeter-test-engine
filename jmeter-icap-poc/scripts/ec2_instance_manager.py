import boto3
import time
from create_stack import Config


def stop_instance(config):
    ec2_client = get_ec2_client(config)
    tag_filter = get_tag_filter(config)

    for instances in ec2_client.describe_instances(Filters=tag_filter)['Reservations']:
        for inst in instances['Instances']:
            print("State: {0}".format(inst['State']['Name']))
            if inst['State']['Name'] == 'running':
                print("Stopping instance now.")
                ec2_client.stop_instances(InstanceIds=[inst['InstanceId']])
                print("Instance stopped")


def start_instance(config):
    ec2_client = get_ec2_client(config)
    tag_filter = get_tag_filter(config)

    for instances in ec2_client.describe_instances(Filters=tag_filter)['Reservations']:
        for inst in instances['Instances']:
            print("State: {0}".format(inst['State']['Name']))
            if inst['State']['Name'] == 'stopped':
                print("Starting instance now.")
                ec2_client.start_instances(InstanceIds=[inst['InstanceId']])
                print("getting IP address...")
                instance_ip = get_instance_ip(ec2_client, inst['InstanceId'])
                while not instance_ip:
                    instance_ip = get_instance_ip(ec2_client, inst['InstanceId'])
                    time.sleep(10)
                    print('getting IP address...')
                return instance_ip
            else:
                ip = get_instance_ip(ec2_client, inst['InstanceId'])
                if(ip):
                    print("ip: {0}".format(ip))
                    return ip


def get_instance_state(ec2_client, instance_id):
    for instances in ec2_client.describe_instances()['Reservations']:
        for instance in instances['Instances']:
            if instance['InstanceId'] == instance_id:
                return instance['State']['Name']


def get_instance_ip(ec2_client, instance_id):
    for instances in ec2_client.describe_instances()['Reservations']:
        for instance in instances['Instances']:
            if instance['InstanceId'] == instance_id:
                if 'PublicIpAddress' in instance:
                    return instance['PublicIpAddress']
                else:
                    return None


def get_ec2_client(config):
    # Authenticate to aws
    profile = config.aws_profile_name
    region = config.region
    session = boto3.session.Session(profile_name=profile, region_name=region)
    ec2_client = session.client('ec2')
    return ec2_client

def get_tag_filter(config):
    tag = config.grafana_server_tag
    tag_filter = [{
        'Name': 'tag:{0}'.format(tag),
        'Values': ['*']
    }]

    return tag_filter
