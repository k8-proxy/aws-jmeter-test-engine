import requests
import json
import argparse


# get command line arguments and return their parsed content
def __get_commandline_args():
    parser = argparse.ArgumentParser(description='Get Grafana template file, prefix to use when producing dashboards, '
                                                 'API key, and grafana URL')
    parser.add_argument('-u', '--url',
                        type=str,
                        help='The URL to your grafana DB home',
                        required=True)

    parser.add_argument('-k', '--key',
                        type=str,
                        help='API key to be used for dashboard creation in grafana database',
                        required=True)
    parser.add_argument('-f', '--file',
                        type=str,
                        help='path to grafana template to be created',
                        required=True)
    parser.add_argument('-p', '--prefix',
                        type=str,
                        help='prefix used for differentiating grafana dashboards and metrics',
                        required=True)

    return parser.parse_args()


#  Appends prefix to all occurrences of "measurement" value in the Grafana JSON file
def __add_prefix_to_grafana_json(grafana_json, prefix):
    if 'panels' in grafana_json:
        for i in grafana_json['panels']:
            if 'targets' in i:
                for j in i['targets']:
                    if 'measurement' in j:
                        j['measurement'] = prefix + j['measurement']


# responsible for posting the dashboard to Grafana and returning the URL to it
def __post_grafana_dash(key, grafana_template, prefix, grafana_url):
    if grafana_url[len(grafana_url) - 1] != '/':
        grafana_url += '/'

    grafana_api_url = grafana_url + 'api/dashboards/db'

    headers = {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"}

    with open(grafana_template) as json_file:
        grafana_json = json.load(json_file)
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
    grafana_template = arguments.file
    prefix = arguments.prefix
    grafana_url = arguments.url

    print(__post_grafana_dash(key, grafana_template, prefix, grafana_url))
