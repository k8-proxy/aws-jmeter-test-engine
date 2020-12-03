#!/usr/bin/env python
# coding: utf-8

from datetime import datetime
import re
import os
import subprocess
from dotenv import load_dotenv
from create_stack_dash import __determineLoadType
import create_dashboard
from create_stack import Config, get_size


def main(json_params):
    # Set Config values gotten from front end
    if json_params['total_users']:
        Config.total_users = int(json_params['total_users'])
    else:
        Config.total_users = 25

    Config.users_per_instance = Config.total_users
    Config.instance_type, jvm_memory = get_size(Config.users_per_instance)
    if json_params['ramp_up_time']:
        Config.ramp_up_time = json_params['ramp_up_time']
    else:
        Config.ramp_up_time = 300
    if json_params['duration']:
        Config.duration = json_params['duration']
    else:
        Config.duration = 900
    if json_params['icap_endpoint_url']:
        Config.icap_endpoint_url = json_params['icap_endpoint_url']
    if json_params['prefix']:
        Config.prefix = json_params['prefix']
    if json_params['load_type']:
        __determineLoadType(json_params['load_type'])

    # ensure that preserve stack and create_dashboard are at default values
    Config.preserve_stack = False
    Config.exclude_dashboard = False

    determine_tls_and_port_params(json_params['load_type'], json_params['enable_tls'], json_params['tls_ignore_error'], json_params['port'])

    # set jmeter parameters
    with open("LocalStartExecution.sh", "r") as f:
        script_data = f.read()

        script_data = re.sub("-Jp_vuserCount=[0-9]*", "-Jp_vuserCount=" + str(Config.users_per_instance), script_data)
        script_data = re.sub("-Jp_rampup=[0-9]*", "-Jp_rampup=" + str(Config.ramp_up_time), script_data)
        script_data = re.sub("-Jp_duration=[0-9]*", "-Jp_duration=" + str(Config.duration), script_data)
        script_data = re.sub("-Jp_url=[a-zA-Z0-9\-\.]*", "-Jp_url=" + str(Config.icap_endpoint_url), script_data)
        script_data = re.sub("Xms[0-9]*m", "Xms" + str(jvm_memory), script_data)
        script_data = re.sub("Xmx[0-9]*m", "Xmx" + str(jvm_memory), script_data)
        script_data = re.sub("-Jp_influxHost=[a-zA-Z0-9\.]*", "-Jp_influxHost=" + Config.influx_host, script_data)
        script_data = re.sub("-Jp_prefix=[A-Za-z0-9_\-]*", "-Jp_prefix=" + Config.prefix, script_data)
        script_data = re.sub("DATA_FILE=[A-Za-z0-9_\-\.]*", "DATA_FILE=" + Config.test_data_file, script_data)
        script_data = re.sub("SCRIPT=[A-Za-z0-9_\-\.]*", "SCRIPT=" + Config.jmx_script_name, script_data)
        script_data = re.sub("-Jp_port=[0-9]*", "-Jp_port=" + str(Config.icap_server_port), script_data)
        script_data = re.sub("-Jp_use_tls=[a-zA-Z]*", "-Jp_use_tls=" + str(Config.enable_tls), script_data)
        script_data = re.sub("-Jp_tls=[a-zA-Z0-9\-\.]*", "-Jp_tls=" + str(Config.tls_verification_method), script_data)

    dir_path = os.path.dirname(os.path.realpath(__file__))
    script_path = os.path.join(dir_path, "RunStartExecution.sh")
    with open(script_path, "w") as f:
        f.write(script_data)
    os.chmod(script_path, 0o771)
    # start execution of tests
    subprocess.Popen([script_path])

    # create dashboard
    Config.grafana_url = "http://127.0.0.1:3000/"
    dashboard_url = ""
    if Config.exclude_dashboard:
        print("Dashboard will not be created")
    else:
        print("Creating dashboard...")
        dashboard_url = create_dashboard.main(Config)

    return dashboard_url


if __name__ == "__main__":
    # test this script
    json_params = {"total_users": 20,
                   "ramp_up_time": 20,
                   "duration": 60,
                   "icap_endpoint_url": "us.icap.glasswall-icap.com",
                   "prefix": "ga",
                   "load_type": "Direct"}
    main(json_params)


def determine_tls_and_port_params(input_load_type, input_enable_tls, input_tls_ignore_verification, input_port):

    if input_load_type == "Direct":

        # enable/disable tls based on user input
        Config.enable_tls = input_enable_tls
        if input_enable_tls:
            Config.enable_tls = "true"
        else:
            Config.enable_tls= "false"

        # if user entered a port, use that. Otherwise port will be set depending on tls_enabled below.
        if input_port:
            Config.icap_server_port = input_port

        # if user did not provide port, set one depending on whether or not tls is enabled
        if not input_port:
            if input_enable_tls:
                Config.icap_server_port = "443"
            else:
                Config.icap_server_port = "1344"

        # If TLS is enabled, get the user preference as to whether or not TLS verification should be used
        if input_enable_tls:
            Config.tls_verification_method = "tls-no-verify" if input_tls_ignore_verification else ""
