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
    def initial_time(database):
        try:
            rs = InfluxDBMetrics.jmeter_db_client.query('SELECT FIRST("count") FROM ' + database)
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
    def final_time(database):
        try:
            rs = InfluxDBMetrics.jmeter_db_client.query('SELECT LAST("count") FROM ' + database)
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
    def count_query(database, start, finish, condition):
        try:
            str_query = 'SELECT SUM("count") FROM '\
                    + database + ' WHERE '\
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
        return InfluxDBMetrics.count_query(prefix + '_jmetericap', start, finish, ' transaction =~ /ICAP-Document-Process/ AND statut =~ /o/')

    @staticmethod
    def failed_reguests(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix + '_jmetericap', start, finish, ' transaction =~ /ICAP-Document-Process/ AND statut=\'ko\'')

    @staticmethod
    def successful_reguests(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix + '_jmetericap', start, finish, ' transaction =~ /ICAP-Document-Process/ AND statut=\'ok\'')

    @staticmethod
    def mean_query(database, start, finish, field, condition = 'statut =~ /o/'):
        try:
            str_query = 'SELECT MEAN("' + field + '") FROM '\
                    + database + ' WHERE '\
                    + condition + ' AND ' \
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
        return InfluxDBMetrics.mean_query(prefix + '_jmetericap', start, finish, 'pct95.0', ' transaction =~ /ICAP-Document-Process/ AND statut =~ /o/')

    # ProxySite
    @staticmethod
    def total_reguests_proxysite(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix + '_jmeterproxysite', start, finish, ' transaction =~ /FileProcess/ AND statut =~ /o/')

    @staticmethod
    def successful_reguests_proxysite(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix + '_jmeterproxysite', start, finish, ' transaction =~ /FileProcess/ AND statut = \'ok\'')

    @staticmethod
    def failed_reguests_proxysite(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix + '_jmeterproxysite', start, finish, ' transaction =~ /FileProcess/ AND statut = \'ko\'')

    @staticmethod
    def average_resp_time_proxysite(prefix, start, finish):
        return InfluxDBMetrics.mean_query(prefix + '_jmeterproxysite', start, finish, 'pct95.0', ' transaction =~ /FileProcess/ AND statut =~ /o/')

    # SharePoint
    @staticmethod
    def total_reguests_sharepoint(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix + '_jmetersharepoint', start, finish, ' transaction =~ /load_File/ AND statut =~ /o/')

    @staticmethod
    def successful_reguests_sharepoint(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix + '_jmetersharepoint', start, finish, ' transaction =~ /load_File/ AND statut = \'ok\'')

    @staticmethod
    def failed_reguests_sharepoint(prefix, start, finish):
        return InfluxDBMetrics.count_query(prefix + '_jmetersharepoint', start, finish, ' transaction =~ /load_File/ AND statut = \'ko\'')

    @staticmethod
    def average_resp_time_sharepoint(prefix, start, finish):
        return InfluxDBMetrics.mean_query(prefix + '_jmetersharepoint', start, finish, 'pct95.0', ' transaction =~ /load_File/ AND statut =~ /o/')

    @staticmethod
    def save_statistics(load_type, prefix, start_time, final_time):
        if load_type == "Direct":
            InfluxDBMetrics.jmeter_db_client.write_points([{"measurement": prefix + "_statistics", "fields": {
                "TotalRequests": InfluxDBMetrics.total_reguests(prefix, start_time, final_time),
                "SuccessfulRequests": InfluxDBMetrics.successful_reguests(prefix, start_time, final_time),
                "FailedRequests": InfluxDBMetrics.failed_reguests(prefix, start_time, final_time),
            }}])
            return
        if load_type == "Proxy Offline":
            InfluxDBMetrics.jmeter_db_client.write_points([{"measurement": prefix + "_proxy_statistics", "fields": {
                "TotalRequests": InfluxDBMetrics.total_reguests_proxysite(prefix, start_time, final_time),
                "SuccessfulRequests": InfluxDBMetrics.successful_reguests_proxysite(prefix, start_time, final_time),
                "FailedRequests": InfluxDBMetrics.failed_reguests_proxysite(prefix, start_time, final_time),
            }}])
            return
        if load_type == "Proxy SharePoint":
            InfluxDBMetrics.jmeter_db_client.write_points([{"measurement": prefix + "_sharepoint_statistics", "fields": {
                "TotalRequests": InfluxDBMetrics.total_reguests_sharepoint(prefix, start_time, final_time),
                "SuccessfulRequests": InfluxDBMetrics.successful_reguests_sharepoint(prefix, start_time, final_time),
                "FailedRequests": InfluxDBMetrics.failed_reguests_sharepoint(prefix, start_time, final_time),
            }}])
            return

    @staticmethod
    def main(argv):

        help_string = 'python3 metrics.py -n <host name> -p <host port>'
        prefix = 'demo'

        try:
            opts, args = getopt.getopt(argv,"hn:p:r:",["name=","port=","prefix="])
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
            elif opt in ('-r', '--prefix'):
                prefix = arg

        InfluxDBMetrics.log_level(LOG_LEVEL)
        print("host name - {}".format(InfluxDBMetrics.hostname))
        print("host port - {}".format(InfluxDBMetrics.hostport))      
        print("prefix    - {}".format(prefix))      

        InfluxDBMetrics.init()

        print('\n\nICAP Test')
        start_time = InfluxDBMetrics.initial_time(prefix + '_jmetericap')
        finish_time = InfluxDBMetrics.final_time(prefix + '_jmetericap')
        print('Initial time {}'.format(start_time))
        print('Final time {}'.format(finish_time))
        print('Total requests {}'.format(InfluxDBMetrics.total_reguests(prefix, start_time, finish_time)))
        print('Failed requests {}'.format(InfluxDBMetrics.failed_reguests(prefix, start_time, finish_time)))
        print('Successfull requests {}'.format(InfluxDBMetrics.successful_reguests(prefix, start_time, finish_time)))
        print('Average response time {}'.format(InfluxDBMetrics.average_resp_time(prefix, start_time, finish_time)))

        print('\n\nProxySite Test')
        prefix = 'ajProxyTest'
        start_time = InfluxDBMetrics.initial_time(prefix + '_jmeterproxysite')
        finish_time = InfluxDBMetrics.final_time(prefix + '_jmeterproxysite')
        print('Initial time {}'.format(start_time))
        print('Final time {}'.format(finish_time))
        print('Total requests {}'.format(InfluxDBMetrics.total_reguests_proxysite(prefix, start_time, finish_time)))
        print('Failed requests {}'.format(InfluxDBMetrics.failed_reguests_proxysite(prefix, start_time, finish_time)))
        print('Successfull requests {}'.format(InfluxDBMetrics.successful_reguests_proxysite(prefix, start_time, finish_time)))
        print('Average response time {}'.format(InfluxDBMetrics.average_resp_time_proxysite(prefix, start_time, finish_time)))

        print('\n\nSharepoint Test')
        prefix = 'sharepoint'    
        start_time = InfluxDBMetrics.initial_time(prefix + '_jmetersharepoint')
        finish_time = InfluxDBMetrics.final_time(prefix + '_jmetersharepoint')
        print('Initial time {}'.format(start_time))
        print('Final time {}'.format(finish_time))
        print('Total requests {}'.format(InfluxDBMetrics.total_reguests_sharepoint(prefix, start_time, finish_time)))
        print('Failed requests {}'.format(InfluxDBMetrics.failed_reguests_sharepoint(prefix, start_time, finish_time)))
        print('Successfull requests {}'.format(InfluxDBMetrics.successful_reguests_sharepoint(prefix, start_time, finish_time)))
        print('Average response time {}'.format(InfluxDBMetrics.average_resp_time_sharepoint(prefix, start_time, finish_time)))


if __name__ == "__main__":
    InfluxDBMetrics.main(sys.argv[1:])