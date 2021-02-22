#!/usr/bin/env python
# coding: utf-8

from datetime import timedelta, datetime, timezone
import re
import os
import subprocess
import create_dashboard
from create_stack import Config
from metrics import InfluxDBMetrics
from ui_tasks import set_config_from_ui
from threading import Thread
import time
import uuid
from database_ops import database_insert_test

running_tests = set()


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
    dashboard_url = ""
    grafana_uid = ""
    if Config.exclude_dashboard:
        print("Dashboard will not be created")
    else:
        print("Creating dashboard...")
        dashboard_url, grafana_uid = create_dashboard.main(Config, from_ui=True)

    run_id = uuid.uuid4()
    running_tests.add(run_id)

    results_analysis_thread = Thread(target=store_and_analyze_after_duration, args=(Config, grafana_uid, run_id))
    results_analysis_thread.start()

    return dashboard_url, run_id


def store_and_analyze_after_duration(config, grafana_uid, run_id, additional_delay=0):

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

    if config.store_results not in ["", None] and bool(int(config.store_results)) and run_id in running_tests:
        print("test completed, storing results to the database")
        database_insert_test(config, run_id, grafana_uid, start_time, final_time)


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
