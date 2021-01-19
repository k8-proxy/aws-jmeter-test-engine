import os
import logging
import sys, getopt
import json
from influxdb import InfluxDBClient

logger = logging.getLogger('proxy-sites')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()

class InfluxDBMetrics():

    hostname = ''
    hostport = ''
    jmeter_db_client = InfluxDBClient()
    icapserver_db_client = InfluxDBClient()
    proxysite_db_client = InfluxDBClient()

    @staticmethod
    def verify_database(db):
        try:
            db.query('SHOW RETENTION POLICIES;')
        except Exception as e:
            print("ERROR: metrics.verify_database: {}".format(e))
            exit(1)

    @staticmethod
    def log_level(level):
        logging.basicConfig(level=getattr(logging, level))

    @staticmethod
    def init():
        InfluxDBMetrics.jmeter_db_client = InfluxDBClient(InfluxDBMetrics.hostname, InfluxDBMetrics.hostport, database='jmeter')
        InfluxDBMetrics.verify_database(InfluxDBMetrics.jmeter_db_client)

        InfluxDBMetrics.icapserver_db_client = InfluxDBClient(InfluxDBMetrics.hostname, InfluxDBMetrics.hostport, database='icapserver')
        InfluxDBMetrics.verify_database(InfluxDBMetrics.icapserver_db_client)

        InfluxDBMetrics.proxysite_db_client = InfluxDBClient(InfluxDBMetrics.hostname, InfluxDBMetrics.hostport, database='proxysite')
        InfluxDBMetrics.verify_database(InfluxDBMetrics.proxysite_db_client)

        print('Metrics module initialization PASSED')

    @staticmethod
    def initial_time(prefix):
        try:
            rs = InfluxDBMetrics.jmeter_db_client.query('SELECT FIRST("count") FROM ' + prefix + '_jmetericap;')
            points = rs.get_points()
            for item in points:
                time = item['time']
                if time:
                    return time
            print('Error getting initial time')
            exit(1)
        except Exception as e:
            print("ERROR: metrics.initial_time: {}".format(e))
            exit(1)


    @staticmethod
    def final_time(prefix):
        try:
            rs = InfluxDBMetrics.jmeter_db_client.query('SELECT LAST("count") FROM ' + prefix + '_jmetericap;')
            points = rs.get_points()
            for item in points:
                time = item['time']
                if time:
                    return time
            print('Error getting final time')
            exit(1)
        except Exception as e:
            print("ERROR: metrics.final_time: {}".format(e))
            exit(1)

    @staticmethod
    def count_query(prefix, start, finish, condition):
        try:
            str_query = 'SELECT SUM("count") FROM '\
                    + prefix + '_jmetericap WHERE '\
                    + ' time >= \'' + start + '\' AND ' \
                    + ' time <= \'' + finish + '\' AND '\
                    + condition \
                    + ';'
            #print (str_query)
            rs = InfluxDBMetrics.jmeter_db_client.query(str_query)
            points = rs.get_points()
            for item in points:
                count = item['sum']
                if count:
                    return int(count)
            return 0
        except Exception as e:
            print("ERROR: metrics.count_query: {}".format(e))
            exit(1)

    @staticmethod
    def total_reguests(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix, start, finish, ' transaction =~ /ICAP-Document-Process/ AND statut =~ /o/')

    @staticmethod
    def failed_reguests(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix, start, finish, ' transaction =~ /ICAP-Document-Process/ AND statut=\'ko\'')

    @staticmethod
    def successful_reguests(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix, start, finish, ' transaction =~ /ICAP-Document-Process/ AND statut=\'ok\'')

    @staticmethod
    def mean_query(prefix, start, finish, field):
        try:
            str_query = 'SELECT MEAN("' + field + '") FROM '\
                    + prefix + '_jmetericap WHERE '\
                    + 'statut =~ /o/ AND ' \
                    + ' time >= \'' + start + '\' AND ' \
                    + ' time <= \'' + finish + '\';'
            #print (str_query)
            rs = InfluxDBMetrics.jmeter_db_client.query(str_query)
            points = rs.get_points()
            for item in points:
                mean = item['mean']
                if mean:
                    return float(mean)
            return float(0)
        except Exception as e:
            print("ERROR: metrics.mean_query: {}".format(e))
            exit(1)

    @staticmethod
    def average_resp_time(prefix, start, finish):
        return InfluxDBMetrics.mean_query(prefix, start, finish, 'pct95.0')

    @staticmethod
    def main(argv):

        help_string = 'python3 metrics.py -n <host name> -p <host port>'
        try:
            opts, args = getopt.getopt(argv,"hn:p:r",["name=","port="])
        except getopt.GetoptError:
            print (help_string)
            sys.exit(2)
        for opt, arg in opts:
            if opt in ('-h','--help'):
                print (help_string)
                sys.exit()
            elif opt in ('-n', '--name'):
                InfluxDBMetrics.hostname = arg
            elif opt in ('-p', '--port'):
                InfluxDBMetrics.hostport = arg

        InfluxDBMetrics.log_level(LOG_LEVEL)
        print("host name - {}".format(InfluxDBMetrics.hostname))
        print("host port - {}".format(InfluxDBMetrics.hostport))      

        InfluxDBMetrics.init()

        prefix = 'demo'
        start_time = InfluxDBMetrics.initial_time(prefix)
        finish_time = InfluxDBMetrics.final_time(prefix)
        print('Initial time {}'.format(start_time))
        print('Final time {}'.format(finish_time))
        print('Total requests {}'.format(InfluxDBMetrics.total_reguests(prefix, start_time, finish_time)))
        print('Failed requests {}'.format(InfluxDBMetrics.failed_reguests(prefix, start_time, finish_time)))
        print('Successfull requests {}'.format(InfluxDBMetrics.successful_reguests(prefix, start_time, finish_time)))
        print('Average response time {}'.format(InfluxDBMetrics.average_resp_time(prefix, start_time, finish_time)))

if __name__ == "__main__":
    InfluxDBMetrics.main(sys.argv[1:])