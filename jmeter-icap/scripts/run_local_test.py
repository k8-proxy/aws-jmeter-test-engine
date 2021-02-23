#!/usr/bin/env python
# coding: utf-8

from datetime import timedelta, datetime, timezone
import re
import os
import subprocess
from dotenv import load_dotenv
import create_dashboard
from create_stack import Config
from ui_tasks import set_config_from_ui
from threading import Thread
from create_stack_dash import store_and_analyze_after_duration, running_tests


def get_jvm_memory(users_per_instance):
    # Determine the size of ec2 instance and jvm memory
    jvm_memory = "9216m"
    if 0 < users_per_instance <= 50:
        jvm_memory = "1024m"
    elif 50 < users_per_instance < 500:
        jvm_memory = "2048m"
    elif 500 <= users_per_instance < 1000:
        jvm_memory = "3072m"
    elif 1000 <= users_per_instance < 2500:
        jvm_memory = "4096m"
    elif 2500 <= users_per_instance:
        jvm_memory = "9216m"

    return jvm_memory


def main(json_params):

    set_config_from_ui(Config, json_params, ova=True)
    Config.users_per_instance = Config.total_users
    jvm_memory = get_jvm_memory(Config.users_per_instance)

    now = datetime.now(timezone.utc)
    date_suffix = now.strftime("%Y-%m-%d-%H-%M-%S")
    prefix = Config.prefix + "-" if Config.prefix not in ["", None] else Config.prefix
    stack_name = prefix + 'aws-jmeter-test-engine-' + date_suffix
    Config.stack_name = stack_name

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

    with open("config-promtail.yml", 'r') as data:
        data = re.sub("glasswall_jmeter", Config.prefix + "_jmeter", data.read())
        data = re.sub("http://[a-zA-Z0-9\-\.]*:3100", f"http://{Config.influx_host}:3100", data)
        data = re.sub("/home/ec2-user/apache-jmeter-5.3/bin/jmeter.log", "/opt/jmeter/apache-jmeter-5.3/bin/jmeter.log", data)

    with open("/usr/local/bin/config-promtail.yml", "w") as f:
        f.write(data)

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
        dashboard_url, grafana_uid = create_dashboard.main(Config)

        if Config.store_results not in ["", None] and bool(int(Config.store_results)):
            running_tests.add(stack_name)
            results_analysis_thread = Thread(target=store_and_analyze_after_duration, args=(Config, grafana_uid))
            results_analysis_thread.start()

    return dashboard_url


if __name__ == "__main__":
    # test this script
    json_params = {"total_users": 20,
                   "ramp_up_time": 20,
                   "duration": 60,
                   "icap_endpoint_url": "us.icap.glasswall-icap.com",
                   "prefix": "ga",
                   "load_type": "Direct",
                   "enable_tls": True,
                   "tls_ignore_error": True,
                   "port": 443}
    main(json_params)
