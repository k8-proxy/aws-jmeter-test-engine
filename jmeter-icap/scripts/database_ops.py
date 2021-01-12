from influxdb import InfluxDBClient
from create_stack import Config
from datetime import datetime


# Connect to influx database, check if tests database exists. If it does not, create it.


def connect_to_influxdb():
    client = InfluxDBClient(host=Config.influx_host, port=8086)
    client.create_database("ResultsDB")
    client.switch_database("ResultsDB")
    return client


# inserts additional info for use in conjunction with other table containing test run results
def database_insert_test(config, run_id, grafana_uid):
    run_id = str(run_id)
    client = connect_to_influxdb()
    client.write_points([{"measurement": "TestResults", "fields": {
        "RunId": run_id,
        "StartTime": str(datetime.now()),
        "Duration": config.duration,
        "GrafanaUid": grafana_uid,
        "Prefix": config.prefix,
        "TotalUsers": config.total_users,
        "LoadType": config.load_type,
        "EndPointUrl": config.icap_endpoint_url,
        "TotalRequests": 0,
        "SuccessfulRequests": 0,
        "FailedRequests": 0,
        "AverageResponseTime": 0,
        "Status": 0
    }}])


# gets the latest # of rows specified
def retrieve_test_results(number_of_rows=0):
    client = connect_to_influxdb()
    query = 'SELECT * from "ResultsDB"."autogen"."TestResults" ORDER BY time DESC LIMIT {0}'.format(number_of_rows)
    results = client.query(query)
    return results.raw
