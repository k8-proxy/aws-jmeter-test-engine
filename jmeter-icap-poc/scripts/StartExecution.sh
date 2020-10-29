# Variables
SCRIPT="ICAP_Direct_FileProcessing_v1.jmx"
DATA_FILE="files.csv"
BUCKET="icap-perf-test-data"
SECRET_ID="GlasswallDataRepositoryTestUser"

###
sudo yum install jq -y
###

# Copy Script file
sudo aws s3 cp s3://aws-testengine-s3/script/$SCRIPT /home/ec2-user/apache-jmeter-5.3/bin/
sudo aws s3 cp s3://aws-testengine-s3/script/$DATA_FILE /home/ec2-user/apache-jmeter-5.3/bin/
sudo aws s3 cp s3://aws-testengine-s3/script/lib/ /home/ec2-user/apache-jmeter-5.3/lib/ --recursive

# Get AWS Credentials
ACCESS_KEY=$(sudo aws secretsmanager get-secret-value --secret-id GlasswallDataRepositoryTestUser --region eu-west-1 | jq -c '.SecretString | fromjson' | jq -r '.AWS_Access_Key')
SECRET_KEY=$(sudo aws secretsmanager get-secret-value --secret-id GlasswallDataRepositoryTestUser --region eu-west-1 | jq -c '.SecretString | fromjson' | jq -r '."AWS_Secret_Key "')

# Start Test Execution
sudo JVM_ARGS="-Xms9216m -Xmx9216m" sh jmeter.sh -n -t $SCRIPT -Jp_vuserCount=4000 -Jp_rampup=300 -Jp_duration=900 -Jp_aws_access_key=$ACCESS_KEY -Jp_aws_secret_key=$SECRET_KEY -Jp_bucket=$BUCKET -Jp_influxHost=10.112.0.112 -Jp_aws_region=eu-west-1 -Jp_url=gw-icap-k8s-a0c293ac.hcp.uksouth.azmk8s.io -Jp_prefix=glasswall -l icaptest-s33.log