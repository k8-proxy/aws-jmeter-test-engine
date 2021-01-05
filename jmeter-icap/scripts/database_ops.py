from influxdb import InfluxDBClient
from create_stack import Config
from datetime import datetime, timedelta
from create_stack import Config


# Connect to influx database, check if tests database exists. If it does not, create it.


def connect_to_influxdb(config):
    client = InfluxDBClient(host=Config.influx_host, port=8086)

    # This will create a database called "tests" if it does not exist. If it already exists, this does nothing.
    client.create_database('tests')
    client.switch_database("tests")
    return client

    # resp = client.write_points(
    #     [{"measurement": "runningTests", "fields": {"duration": 101, "startTime": 102, "endTime": 103}}])
    #
    # results = client.query('SELECT * from "tests"."autogen"."runningTests"')
    # print(results.raw)
    #
    # # here you can get the data in rows and print them one by one, or print specific fields from within.
    # points = results.get_points()
    # for p in points:
    #     print(p)


def insert_dummy_data(config):
    client = connect_to_influxdb(Config)

    for i in range(0, 10):
        start_time = datetime.now() + timedelta(seconds=int(10 + i))
        client.write_points([
            {"measurement": "TestRun",
             "fields": {"StartTime": str(start_time), "RunID": i, "RunTime": 10 * i, "RampUp": 10 * i + 1, "Threads": 10 * i + 2,
                        "TotalRequests": 10 * i + 3, "SuccessfulRequests": 10 * i + 4, "FailedRequests": 10 * i + 5, "AverageResponseTime": 10 * i + 6,
                        "MaxConcurrentPods": 10 * i + 7}}])


# used to insert additional information about a test run to be used in conjunction with other table containing test run results.
def insert_test(form_json, grafana_url, stack_name):
    prefix = form_json['prefix']
    duration = form_json['duration']
    start_time = datetime.now()
    end_time = start_time + timedelta(seconds=int(duration))

    client = connect_to_influxdb(Config)

    client.write_points([
        {"measurement": "TestsInfo",
         "fields": {"StartTime": str(start_time), "EndTime": str(end_time), "Prefix": prefix, "Duration": duration, "StackName": stack_name, "GrafanaUrl": grafana_url}}])

def retrieve_tests():
    client = connect_to_influxdb(Config)
    results = client.query('SELECT * from "tests"."autogen"."TestRun"')
    return results.raw

if __name__ == "__main__":
    client = connect_to_influxdb(Config)
    # print(client.get_list_database())
    # client.drop_database("tests")
    # insert_dummy_data(Config)
    results = client.query('SELECT * from "tests"."autogen"."TestRun"')
    print(results.raw)
    points = results.get_points()
    for p in points:
        print(p)
