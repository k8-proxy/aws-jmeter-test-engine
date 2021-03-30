# Using prom_datasource.py  to Create Prometheus Datasource in Grafana

## Introduction

Grafana allows you to create dashboards by sending HTTP post requests using their API. [An example post request for a new datasource can be seen here.](https://grafana.com/docs/grafana/latest/datasources/)

Prometheus Datasource creation can be automated using this method, and this is what is attempted with the prom_datasource.py  script.

This script is parameterized python script that should be run along with the passing parameter to script. below is the exmplaintion how to execute it.

## Prerequisites

In order to create prometheus Datasource using the Grafana API, a Grafana username and password must be provided as parameter alson with the Datasource name and URL.

you need to install python3 on your machine. 

Install [Python](https://www.python.org/downloads/).

## Step By Step

once you have an python3 and pip3 install in your system and you have an grafana endpoints, follow the following steps.

1) clone the aws-jmeter-test-engine [Github_Repo] (https://github.com/k8-proxy/aws-jmeter-test-engine/).

```
git clone https://github.com/k8-proxy/aws-jmeter-test-engine/
```

2) go to jmeter-icap/script folder

```
cd aws-jmeter-test-engine/jmeter-icap/script
```

3) then run following command with all Parameter with the script . 

example : 

```
python3 prom_datasource.py -u "Prometheus URL" -n "Name Of Datasource ex: prometheus" --username "Username of Grafana" --password "Password of grafana" --apiendpoint http://"Grafana Endpoint:Port"/api/datasources
```
## Options/Parameters available for the prom_datasource.py script

<table>
<tr>
<td width="200"> Parameter</td> <td> Description </td>
</tr>
<tr>
<td> --URL, -u </td> <td>actual prometheus URL along with the Port if you expose with port and Ip or DNS name if you expose it with FQDN default is localhost:9090 </td>
</tr>
<tr>
<td> --name, -n </td> <td> Name of the datasource that we want to give in grafana </td>
</tr>
<tr>
<td> --username</td> <td>Input username for grafana <td>
</tr>
<tr>
<td> --password</td> <td>Input Password for grafana </td>
</tr>
<tr>
<td> --apiendpoint </td> <td>Input API_ENDPOINT for grafana default it is http://localhost:3000/api/datasources replace it with your grafana FQDN or IP:Port </td>
</tr>
</table>

## once the script is executed successful you visit the grafana and view the datasource section and you will see the datasource should be created with the values you have pass during execution of script.

## datasource created on grafana with script we run.

![Prometheous_datasource_created](img/prometheus_datasource.PNG)
