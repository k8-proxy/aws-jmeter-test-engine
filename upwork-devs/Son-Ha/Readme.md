# Modify Jmeter to send different ICAP server error codes to influx DB to show on the dashboard

## What is ICAP server response codes 
ICAP server doesnt have any response header message, all response header are in response body, it is represented like below :
```bash
	ICAP server:icapservercloudproxy.io, ip:1.2.4.5, port:1344

	ICAP HEADERS:
			ICAP/1.0 200 OK
			Server: C-ICAP/0.5.6
			Connection: keep-alive
			ISTag: CI0001-1.1.1
			Encapsulated: res-hdr=0, res-body=182

	RESPMOD HEADERS:
			HTTP/1.0 200 OK
			Date: Wed Sep  2 12:50:58 2020
			Last-Modified: Wed Sep  2 12:50:58 2020
			Content-Length: 17266
			Via: ICAP/1.0 localhost (C-ICAP/0.5.6 Glasswall Rebuild service )
	REQMOD HEADERS:
        GET http://mycloudstore/container/hyperlink_small.pdf HTTP/1.0
        Last-Modified: Wed Sep  2 13:23:20 2020
        Content-Length: 16446
        User-Agent: C-ICAP-Client/x.xx
        Content-Length: 17266
        Via: ICAP/1.0 localhost (C-ICAP/0.5.6 Glasswall Rebuild service )
```
we have 3 response headers: ICAP HEADERS,RESMOD HEADERS and REQMOD HEADERS. However, REQMOD HEADERS is used to simulate the uploading of a document and providing a dummy destination URL.
Finally, 2 response header ICAP HEADERS,RESMOD HEADERS are used to collect error codes and send to influxDB

## How JMeter Script works?
Jmeter script is designed to send different error codes to influx DB.

It basically 
- Run icap client command to fetch ICAP server response
- Convert ICAP server response header to InfluxDB line syntax
- Post InfluxDB line syntax to InfluxDB server as measurements, have 2 measurements : ICAP_HEADERS measurements to show ICAP HEADERS codes and RESPMOD_HEADERS to show RESPMOD HEADERS response code
- Present measurements into Grafana dashboard

## Prerequisites
	icap client is configured already
	InfluxDB is installed
	Grafana is installed

## Usage

### Import Icap server response codes dashboard to grafana
Open Grafana > Manage Dashboard > import > Select "ICAP_Server_Response_Code_Dashboard.json" to import

### Setup parameters of Jmeter script
Refer ICAPServerResponseCode.properties to setup parameters accordingly

### Run Jmeter script 
Go to main directory and build docker image from dockerfile following command:
```bash
[root@sonha bin]#./jmeter -n -t <path to file\>Fetch_ICAP_Server_responseCode.jmx -l icaptest.log -q <path to file\>ICAPServerResponseCode.properties

```
### Grafana Dashboard monitoring 
Make sure Jmeter running, go to grafana, select dashboard and view the ICAP server response codes
  
## License
MIT License
See: LICENSE
