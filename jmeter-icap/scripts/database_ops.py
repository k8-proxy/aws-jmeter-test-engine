from influxdb import InfluxDBClient
from create_stack import Config
from metrics import InfluxDBMetrics
from ui_tasks import LoadType

# Connect to influx database, check if tests database exists. If it does not, create it.
def connect_to_influxdb():

    client = InfluxDBClient(host=Config.influx_public_ip if Config.influx_public_ip not in ["", None] else Config.influx_host, port=Config.influx_port)
    client.create_database("ResultsDB")
    client.switch_database("ResultsDB")
    return client


def database_insert_test(config, run_id, grafana_uid, start_time, final_time):
    run_id = str(run_id)
    client = connect_to_influxdb()
    InfluxDBMetrics.hostname = config.influx_public_ip if config.influx_public_ip not in ["", None] else config.influx_host
    InfluxDBMetrics.hostport = config.influx_port
    InfluxDBMetrics.init()
    if config.load_type == LoadType.direct.value:
        client.write_points([{"measurement": "TestResults", "fields": {
            "RunId": run_id,
            "StartTime": start_time,
            "Duration": config.duration,
            "GrafanaUid": grafana_uid,
            "Prefix": config.prefix,
            "TotalUsers": config.total_users,
            "LoadType": config.load_type,
            "EndPointUrl": config.icap_endpoint_url,
            "TotalRequests": InfluxDBMetrics.total_reguests(config.prefix, start_time, final_time),
            "SuccessfulRequests": InfluxDBMetrics.successful_reguests(config.prefix, start_time, final_time),
            "FailedRequests": InfluxDBMetrics.failed_reguests(config.prefix, start_time, final_time),
            "AverageResponseTime": InfluxDBMetrics.average_resp_time(config.prefix, start_time, final_time),
            "Status": 0
        }}])
        return
    if config.load_type == LoadType.proxy.value:
        client.write_points([{"measurement": "TestResults", "fields": {
            "RunId": run_id,
            "StartTime": start_time,
            "Duration": config.duration,
            "GrafanaUid": grafana_uid,
            "Prefix": config.prefix,
            "TotalUsers": config.total_users,
            "LoadType": config.load_type,
            "EndPointUrl": config.icap_endpoint_url,
            "TotalRequests": InfluxDBMetrics.total_reguests_proxysite(config.prefix, start_time, final_time),
            "SuccessfulRequests": InfluxDBMetrics.successful_reguests_proxysite(config.prefix, start_time, final_time),
            "FailedRequests": InfluxDBMetrics.failed_reguests_proxysite(config.prefix, start_time, final_time),
            "AverageResponseTime": InfluxDBMetrics.average_resp_time_proxysite(config.prefix, start_time, final_time),
            "Status": 0
        }}])
        return
    if config.load_type == LoadType.proxy_sharepoint.value or config.load_type == LoadType.direct_sharepoint.value:
        client.write_points([{"measurement": "TestResults", "fields": {
            "RunId": run_id,
            "StartTime": start_time,
            "Duration": config.duration,
            "GrafanaUid": grafana_uid,
            "Prefix": config.prefix,
            "TotalUsers": config.total_users,
            "LoadType": config.load_type,
            "EndPointUrl": config.icap_endpoint_url,
            "TotalRequests": InfluxDBMetrics.total_reguests_sharepoint(config.prefix, start_time, final_time),
            "SuccessfulRequests": InfluxDBMetrics.successful_reguests_sharepoint(config.prefix, start_time, final_time),
            "FailedRequests": InfluxDBMetrics.failed_reguests_sharepoint(config.prefix, start_time, final_time),
            "AverageResponseTime": InfluxDBMetrics.average_resp_time_sharepoint(config.prefix, start_time, final_time),
            "Status": 0
        }}])
        return


# gets the latest # of rows specified
def retrieve_test_results(number_of_rows=0):
    client = connect_to_influxdb()
    query = 'SELECT * from "ResultsDB"."autogen"."TestResults" ORDER BY time DESC LIMIT {0}'.format(number_of_rows)
    results = client.query(query)
    return results.raw
