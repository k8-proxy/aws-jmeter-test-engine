#!/bin/bash
# Variables
SCRIPT=ICAP_Direct_FileProcessing_v1.jmx
DATA_FILE=files.csv

# Start Test Execution
cd /opt/jmeter/apache-jmeter-5.3/bin/
sudo JVM_ARGS="-Xms9216m -Xmx9216m" sh jmeter.sh -n -t $SCRIPT -Jp_vuserCount=4000 -Jp_filetype=$DATA_FILE -Jp_rampup=300 -Jp_duration=900 -Jp_influxHost=10.112.0.112 -Jp_url=gw-icap01.westeurope.azurecontainer.io -Jp_prefix=glasswall -Jp_port=1344 -Jp_use_tls=false -Jp_tls=no-verify -l icaptest-s33.log
