#!/bin/bash

c-icap-client -i icap-client-main.uksouth.cloudapp.azure.com -p 1344 -s gw_rebuild 2>&1 | tee status.txt

grep '200 OK' status.txt

status=$?
if [ $status -eq 0 ]
then
	echo "icap server is up"
else
	echo "icap server is down"
	exit 1
fi
