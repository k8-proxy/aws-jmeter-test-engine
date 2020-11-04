# Variables
SCRIPT="ICAP_Direct_FileProcessing_v1.jmx"
DATA_FILE="files.csv"
SCRIPT_BUCKET="aws-testengine-s3"
TEST_DATA_BUCKET="icap-perf-test-data"
SECRET_ID="GlasswallDataRepositoryTestUser"
REGION="eu-west-1"

###
sudo yum install jq -y
###

# Copy Script file
sudo aws s3 cp s3://$SCRIPT_BUCKET/script/$SCRIPT /home/ec2-user/apache-jmeter-5.3/bin/
sudo aws s3 cp s3://$SCRIPT_BUCKET/script/$DATA_FILE /home/ec2-user/apache-jmeter-5.3/bin/
sudo aws s3 cp s3://$SCRIPT_BUCKET/script/lib/ /home/ec2-user/apache-jmeter-5.3/lib/ --recursive

# Get AWS Credentials
ACCESS_KEY=$(sudo aws secretsmanager get-secret-value --secret-id GlasswallDataRepositoryTestUser --region $REGION | jq -c '.SecretString | fromjson' | jq -r '.AWS_Access_Key')
SECRET_KEY=$(sudo aws secretsmanager get-secret-value --secret-id GlasswallDataRepositoryTestUser --region $REGION | jq -c '.SecretString | fromjson' | jq -r '."AWS_Secret_Key "')

# Start Test Execution
sudo JVM_ARGS="-Xms9216m -Xmx9216m" sh jmeter.sh -n -t $SCRIPT -Jp_vuserCount=4000 -Jp_filetype=$DATA_FILE -Jp_rampup=300 -Jp_duration=900 -Jp_aws_access_key=$ACCESS_KEY -Jp_aws_secret_key=$SECRET_KEY -Jp_bucket=$TEST_DATA_BUCKET -Jp_influxHost=10.112.0.112 -Jp_aws_region=$REGION -Jp_url=gw-icap01.westeurope.azurecontainer.io -Jp_prefix=glasswall -l icaptest-s33.log
