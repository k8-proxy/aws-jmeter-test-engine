import requests
import json
import argparse


# get command line arguments and return their parsed content
def __get_commandline_args():
    parser = argparse.ArgumentParser(fromfile_prefix_chars='@', description='Get Grafana template file, prefix to use when producing dashboards, '
                                                 'API key, and grafana URL')
    parser.add_argument('--grafana_url', '-g',
                        type=str,
                        help='The URL to your grafana DB home',
                        default="10.112.0.112:3000")

    parser.add_argument('--key', '-k',
                        type=str,
                        help='API key to be used for dashboard creation in grafana database',
                        default="")

    parser.add_argument('--grafana_file', '-f',
                        type=str,
                        help='path to grafana template used for dashboard creation',
                        default="")

    parser.add_argument('--prefix', '-p', default="",
                        help='prefix used for differentiating grafana dashboards and metrics')

    parser.add_argument('--instances_required', '-q', default="3",
                        help='Number of instances required, needed to modify Grafana JSON')

    return parser.parse_args()


#  Appends prefix to title and all occurrences of "measurement" value in the Grafana JSON file
def __add_prefix_to_grafana_json(grafana_json, prefix):
    grafana_json["dashboard"]["title"] = prefix + '-' + grafana_json["dashboard"]["title"]

    if 'panels' in grafana_json["dashboard"]:
        for i in grafana_json["dashboard"]['panels']:
            for j in i:
                if 'targets' in j:
                    for k in i['targets']:
                        if 'measurement' in k:
                            k['measurement'] = prefix + '-' + k['measurement']


# add instances_required field to Grafana JSON under Number of Users
def __add_users_req_to_grafana_json(grafana_json, instances_required):
    for i in grafana_json["dashboard"]['panels']:
        for j in i:
            if 'targets' in j:
                for k in i['targets']:
                    if "alias" in k and k["alias"] == "Number of Users":
                        k["select"][0][1]["params"][0] = " /*" + instances_required


# responsible for posting the dashboard to Grafana and returning the URL to it
def __post_grafana_dash(key, grafana_template, prefix, grafana_url, instances_required):
    if grafana_url[len(grafana_url) - 1] != '/':
        grafana_url += '/'

    grafana_api_url = grafana_url + 'api/dashboards/db'

    headers = {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"}

    with open(grafana_template) as json_file:
        grafana_json = json.load(json_file)
        __add_users_req_to_grafana_json(grafana_json, instances_required)
        __add_prefix_to_grafana_json(grafana_json, prefix)

    resp = requests.post(grafana_api_url, json=grafana_json, headers=headers)
    d = eval(resp.text)

    # if the response contains a URL, use it to build a url that links directly to the newly created dashboard
    if "url" in d:
        return grafana_url + d.get('url')


# main: Gets command line arguments, creates dashboard in grafana, outputs URL in response (if any)
if __name__ == '__main__':
    arguments = __get_commandline_args()

    key = arguments.key
    grafana_template = arguments.grafana_file
    prefix = arguments.prefix
    grafana_url = arguments.grafana_url
    instances_required = arguments.instances_required

    created_dashboard_url = __post_grafana_dash(key, grafana_template, prefix, grafana_url, instances_required)
    if created_dashboard_url:
        print("Dashboard created at: ")
        print(created_dashboard_url)
