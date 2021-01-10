from influxdb import InfluxDBClient
from create_stack import Config
from datetime import datetime, timedelta
from create_stack import Config


# Connect to influx database, check if tests database exists. If it does not, create it.


def connect_to_influxdb():
    client = InfluxDBClient(host=Config.influx_host, port=8086)
    client.switch_database("tests")
    return client

def insert_dummy_data(config):
    client = connect_to_influxdb()

    client.write_points([
        {"measurement": "TestRun",
         "fields": {"StartTime": str(datetime.now()), "Prefix": "aj", "RunId": "9bc04c12-911f-46be-b36e-5ac9a202272a", "RunTime": 100 , "RampUp": 10, "Threads": 11,
                    "TotalRequests": 13, "SuccessfulRequests": 14, "FailedRequests": 15, "AverageResponseTime": 16,
                    "MaxConcurrentPods": 17, "Status": 0, "LoadType": "Direct"}}])

    client.write_points([
        {"measurement": "TestRun",
         "fields": {"StartTime": str(datetime.now() + timedelta(seconds=int(10))), "Prefix": "aj2", "RunId": "e88f826b-c9ed-4e66-a793-bb156c2997d2",
                    "RunTime": 200, "RampUp": 20, "Threads": 21,
                    "TotalRequests": 23, "SuccessfulRequests": 24, "FailedRequests": 25, "AverageResponseTime": 26,
                    "MaxConcurrentPods": 27, "Status": 1, "LoadType": "Proxy"}}])

    client.write_points([
        {"measurement": "TestRun",
         "fields": {"StartTime": str(datetime.now() + timedelta(seconds=int(20))), "Prefix": "aj3", "RunId": "5860e3dc-4490-4f49-870b-b070b555bfa8",
                    "RunTime": 300, "RampUp": 30, "Threads": 31,
                    "TotalRequests": 33, "SuccessfulRequests": 34, "FailedRequests": 35, "AverageResponseTime": 36,
                    "MaxConcurrentPods": 37, "Status": 1, "LoadType": "Direct"}}])


# inserts additional info for use in conjunction with other table containing test run results
def database_insert_test(run_id, grafana_uid, form_json):

    duration = form_json['duration']
    prefix = form_json['prefix']
    total_users = form_json['total_users']
    load_type = form_json['load_type']
    end_pt_url = form_json['icap_endpoint_url']

    run_id = str(run_id)
    client = connect_to_influxdb()
    client.write_points([{"measurement": "TestsInfo", "fields": {"RunId": run_id, "Duration": duration, "GrafanaUid": grafana_uid, "Prefix" : prefix, "TotalUsers": total_users, "LoadType": load_type, "EndPtUrl": end_pt_url}}])


# gets the latest # of rows specified
def retrieve_test_results(no_of_rows=0):
    client = connect_to_influxdb()
    query = 'SELECT * from "tests"."autogen"."TestRun" ORDER BY time DESC LIMIT {0}'.format(no_of_rows)
    results = client.query(query)
    return results.raw


def retrieve_test_info():
    client = connect_to_influxdb()
    results = client.query('SELECT * from "tests"."autogen"."TestsInfo"')
    return results.raw
