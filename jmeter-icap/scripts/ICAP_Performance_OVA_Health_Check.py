import requests


# global variable
#
healthStatus=1

def checkLocalStatus(port,service):
    global healthStatus
    try:
       requests.get("http://localhost:"+str(port), timeout=10)
       print (service+"  is ok")
    except requests.RequestException as e:
       print(service+" failed")
       healthStatus=0


checkLocalStatus(5000,"Flask")
checkLocalStatus(80,"Apache")
checkLocalStatus(3000,"Grafana")
checkLocalStatus(8086,"InfluxDB")

try:
    requests.get("https://google.com", timeout=10)
    print("Internet Connection is ok")
except requests.RequestException as e:
    print("Internet Connection failed")
    healthStatus = 0

if healthStatus==0:
    print ("Setup is not functional")