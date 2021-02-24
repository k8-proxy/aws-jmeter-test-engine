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
    local_config = Config()
    set_config_from_ui(local_config, json_params, ova=True)
    local_config.users_per_instance = local_config.total_users
    jvm_memory = get_jvm_memory(local_config.users_per_instance)

    now = datetime.now(timezone.utc)
    date_suffix = now.strftime("%Y-%m-%d-%H-%M-%S")
    prefix = local_config.prefix + "-" if local_config.prefix not in ["", None] else local_config.prefix
    stack_name = prefix + 'aws-jmeter-test-engine-' + date_suffix
    local_config.stack_name = stack_name

    # set jmeter parameters
    with open("LocalStartExecution.sh", "r") as f:
        script_data = f.read()

        script_data = re.sub("-Jp_vuserCount=[0-9]*", "-Jp_vuserCount=" + str(local_config.users_per_instance), script_data)
        script_data = re.sub("-Jp_rampup=[0-9]*", "-Jp_rampup=" + str(local_config.ramp_up_time), script_data)
        script_data = re.sub("-Jp_duration=[0-9]*", "-Jp_duration=" + str(local_config.duration), script_data)
        script_data = re.sub("-Jp_url=[a-zA-Z0-9\-\.]*", "-Jp_url=" + str(local_config.icap_endpoint_url), script_data)
        script_data = re.sub("Xms[0-9]*m", "Xms" + str(jvm_memory), script_data)
        script_data = re.sub("Xmx[0-9]*m", "Xmx" + str(jvm_memory), script_data)
        script_data = re.sub("-Jp_influxHost=[a-zA-Z0-9\.]*", "-Jp_influxHost=" + local_config.influx_host, script_data)
        script_data = re.sub("-Jp_prefix=[A-Za-z0-9_\-]*", "-Jp_prefix=" + local_config.prefix, script_data)
        script_data = re.sub("DATA_FILE=[A-Za-z0-9_\-\.]*", "DATA_FILE=" + local_config.test_data_file, script_data)
        script_data = re.sub("SCRIPT=[A-Za-z0-9_\-\.]*", "SCRIPT=" + local_config.jmx_script_name, script_data)
        script_data = re.sub("-Jp_port=[0-9]*", "-Jp_port=" + str(local_config.icap_server_port), script_data)
        script_data = re.sub("-Jp_use_tls=[a-zA-Z]*", "-Jp_use_tls=" + str(local_config.enable_tls), script_data)
        script_data = re.sub("-Jp_tls=[a-zA-Z0-9\-\.]*", "-Jp_tls=" + str(local_config.tls_verification_method), script_data)

    with open("config-promtail.yml", 'r') as data:
        data = re.sub("glasswall_jmeter", local_config.prefix + "_jmeter", data.read())
        data = re.sub("http://[a-zA-Z0-9\-\.]*:3100", f"http://{local_config.influx_host}:3100", data)
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
    dashboard_url = ""
    if local_config.exclude_dashboard:
        print("Dashboard will not be created")
    else:
        print("Creating dashboard...")
        dashboard_url, grafana_uid = create_dashboard.main(local_config, from_ui=True)

        if local_config.store_results not in ["", None] and bool(int(local_config.store_results)):
            running_tests.add(stack_name)
            results_analysis_thread = Thread(target=store_and_analyze_after_duration, args=(local_config, grafana_uid))
            results_analysis_thread.start()

    return dashboard_url, local_config.stack_name


if __name__ == "__main__":
    # test this script
    json_params = {"total_users": str(20),
                   "ramp_up_time": str(20),
                   "duration": str(300),
                   "icap_endpoint_url": "us.icap.glasswall-icap.com",
                   "prefix": "ga",
                   "load_type": "Direct",
                   "enable_tls": True,
                   "tls_ignore_error": True,
                   "port": 443}
    main(json_params)