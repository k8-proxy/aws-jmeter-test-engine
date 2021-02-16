import os
import subprocess
from enum import Enum


# runs a shell script containing command "killall -9 java"
def terminate_java_processes():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    script_path = os.path.join(dir_path, "stopTests.sh")
    os.chmod(script_path, 0o771)
    subprocess.Popen([script_path])


def modify_hosts_file(ip_addr: str, ova=False):
    if ova:
        content = "127.0.0.1 localhost\n{0} www.gov.uk.local assets.publishing.service.gov.uk.local www.gov.uk assets.publishing.service.gov.uk.glasswall-icap.com".format(ip_addr)
        with open("/etc/hosts", "w") as f:
            f.write(content)
            f.close()


def determine_load_type(config, ova=False):
    if config.load_type == LoadType.direct.value:
        config.test_directory = 'ICAP-Direct-File-Processing'
        config.jmx_script_name = 'ICAP_Direct_FileProcessing_Local_v4.jmx' if ova else 'ICAP_Direct_FileProcessing_v3.jmx'
        config.grafana_file = 'aws-test-engine-dashboard.json'
        if ova:
            config.test_data_file = 'gov_uk_files.csv'

    elif config.load_type == LoadType.proxy.value:
        config.test_directory = 'ICAP-Proxy-Site'
        config.jmx_script_name = 'ProxySite_Processing_v1.jmx'
        config.grafana_file = 'ProxySite_Dashboard_Template.json'
        if ova:
            config.test_data_file = 'proxysitefiles.csv'

    elif config.load_type == LoadType.proxy_sharepoint.value or config.load_type == LoadType.direct_sharepoint.value:
        config.test_directory = 'ICAP-Sharepoint-Site'
        config.jmx_script_name = 'ICAP-Sharepoint-Upload-Download-v1.jmx'
        config.grafana_file = 'Sharepoint-Demo-Dashboard.json'
        if ova:
            config.test_data_file = 'sharepoint_files.csv'


def set_config_from_ui(config, json_params, ova=False):
    # Set Config values gotten from front end
    if json_params['total_users']:
        config.total_users = int(json_params['total_users'])
    else:
        config.total_users = 25

    if json_params['ramp_up_time']:
        config.ramp_up_time = json_params['ramp_up_time']
    else:
        config.ramp_up_time = 300
    if json_params['duration']:
        config.duration = json_params['duration']
    else:
        config.duration = 900
    if json_params['icap_endpoint_url']:
        config.icap_endpoint_url = json_params['icap_endpoint_url']
    if json_params['prefix']:
        config.prefix = json_params['prefix']
    if json_params['load_type']:
        config.load_type = json_params['load_type']
        determine_load_type(config, ova=ova)

        if json_params['load_type'] == LoadType.proxy.value:
            modify_hosts_file(json_params['icap_endpoint_url'], ova)
        elif json_params['load_type'] == LoadType.proxy_sharepoint.value:

            sharepoint_ip = str(json_params['sharepoint_hosts'])
            sharepoint_hosts = ""
            sharepoint_field_input = str(json_params['sharepoint_hosts'])
            try:
                (sharepoint_ip, sharepoint_hosts) = sharepoint_field_input.split(maxsplit=1)
            except ValueError:
                print("Please insert both sharepoint IP and Sharepoint Hosts")
            config.sharepoint_proxy_ip = sharepoint_ip
            config.sharepoint_host_names = sharepoint_hosts

    # ensure that preserve stack and create_dashboard are at default values
    config.preserve_stack = False
    config.exclude_dashboard = False
    determine_tls_and_port_params(config, json_params['enable_tls'], json_params['tls_ignore_error'],
                                  json_params['port'])


def determine_tls_and_port_params(config, input_enable_tls, input_tls_ignore_verification, input_port):
    if config.load_type == LoadType.direct.value:

        # enable/disable tls based on user input
        config.enable_tls = str(input_enable_tls).lower()

        # if user entered a port, use that. Otherwise port will be set depending on tls_enabled below.
        if input_port:
            config.icap_server_port = input_port

        # if user did not provide port, set one depending on whether or not tls is enabled
        if not input_port:
            if input_enable_tls:
                config.icap_server_port = "443"
            else:
                config.icap_server_port = "1344"

        # If TLS is enabled, get the user preference as to whether or not TLS verification should be used
        if input_enable_tls:
            config.tls_verification_method = "-tls-no-verify" if input_tls_ignore_verification else ""


class LoadType(str, Enum):
    direct = "Direct"
    proxy = "Proxy"
    proxy_sharepoint = "Proxy SharePoint"
    direct_sharepoint = "Direct Sharepoint"
