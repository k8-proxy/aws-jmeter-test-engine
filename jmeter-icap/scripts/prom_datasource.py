import os
import requests, argparse

API_ENDPOINT = "http://34.241.195.26:3000/api/datasources"
username = "admin"
password = "admin"
url = "localhost:9090"
name = "localhost"

example = 'Example: python3 prom_datasource.py -u localhost:9090 -n localhost --username admin --password password '
parser = argparse.ArgumentParser(description=example)
parser.add_argument("--url", "-u", help="Input url for datasource")
parser.add_argument("--name", "-n", help="Input datasource name")
parser.add_argument("--username", help="Input username for grafana")
parser.add_argument("--password", help="Input password for grafana")

args = parser.parse_args()
if args.url:
    url = args.url
if args.name:
    name = args.name
if args.username:
    username = args.username
if args.password:
    password = args.password

# create  datasource
Prometheus_data = {
  "name": name,
  "type":"prometheus",
  "url": url,
  "access":"Server",
 "basicAuth": "false"
    }
headers={'content-type': 'application/json'}

# sending post request and saving response as response object
r = requests.post(url=API_ENDPOINT, data=Prometheus_data,auth=(username, password))

# extracting response text

print("prometheus  datasource :%s" % r.text)

