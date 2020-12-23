#!/bin/bash
EXPORT_ID=$(cat out.json | jq -r .[].ExportTaskId)
echo $EXPORT_ID
# increase file size until 1KB
until [ "$RESPONSE" = "completed" ]
do
  RESPONSE=$(aws ec2 describe-export-tasks --export-task-ids $EXPORT_ID | jq -r .ExportTasks[].State)
  if [ "$RESPONSE" != "exit" ]; then
    #echo "Hello $RESPONSE"
    echo "OVA Upload in progress..."
    sleep 30
  fi
done

echo "Upload Completed !!!"

#PROFILE=default
#BUCKET=packer-data
#
#OBJECT="$(aws s3 ls --profile $PROFILE $BUCKET/vms/ | sort | tail -n 1 | awk '{print $4}')"
#echo "Downloading OVA..."
#aws s3 cp s3://$BUCKET/vms/$OBJECT $OBJECT --profile $PROFILE
#echo "Download Complete !!!"
#echo "Uploading OVA to ESXI..."
#ovftool --name=Packer-$OBJECT --disableVerification  --noSSLVerify --datastore=datastore1 --network="VMs" $OBJECT  vi://root:<password>@46.165.225.145
