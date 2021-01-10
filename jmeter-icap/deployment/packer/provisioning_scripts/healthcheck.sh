#!/bin/bash

> healthstatus.txt
healthStatus=0
SERVER=localhost

checkLocalStatus () {
(</dev/tcp/$SERVER/$1) 2>/dev/null
    if [ "$?" -ne 0 ]; then
      echo "Connection to $2  on port $1 failed"
      healthStatus=0
      echo "$healthStatus" >> healthstatus.txt
    else
      echo "Connection to $2 on port $1 succeeded."
      healthStatus=1
      echo "$healthStatus" >> healthstatus.txt
    fi
}

checkLocalStatus 5000 "Flask"
checkLocalStatus 80 "Apache"
checkLocalStatus 3000 "Grafana"
checkLocalStatus 8086 "InfluxDB"


if [ ! -z $(grep 0 "healthstatus.txt") ]; then
  echo "Health status: Failed";
  exit 1
else
  echo "Health status: Success"
fi
