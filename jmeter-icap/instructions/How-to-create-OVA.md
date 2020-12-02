#How to setup OVA ?

The following instructions will help to setup OVA that will include dashboarding and load generation solutions.
Virtual Machine OS to be used here is Ubuntu 20.04.
Easiest way to create OVA is to setup everything in EC2 instance in AWS and then export EC2 as OVA.


##1. Install Loki

```bash
cd /usr/local/bin
sudo curl -fSL -o loki.gz "https://github.com/grafana/loki/releases/download/v2.0.0/loki-linux-amd64.zip"
sudo gunzip loki.gz
sudo chmod a+x loki
sudo wget https://raw.githubusercontent.com/grafana/loki/master/cmd/loki/loki-local-config.yaml
sudo useradd --system loki
```
Create loki.service file with following content:

```bash
sudo nano /etc/systemd/system/loki.service

[Unit]
Description=Loki service
After=network.target

[Service]
Type=simple
User=loki
ExecStart=/usr/local/bin/loki -config.file /usr/local/bin/loki-local-config.yaml

[Install]
WantedBy=multi-user.target

```

Start loki service and make it run on boot.

```bash
sudo service loki start
sudo service loki status
sudo systemctl enable loki.service
```
#Install ICAP client
```bash
sudo apt-get update
sudo apt-get install c-icap -y
```

##Install InfluxDB

```bash
echo "deb https://repos.influxdata.com/ubuntu bionic stable" | sudo tee /etc/apt/sources.list.d/influxdb.list

curl -sL https://repos.influxdata.com/influxdb.key | sudo apt-key add -
apt-get update
apt-get install influxdb
systemctl start influxdb
systemctl status influxdb
systemctl enable --now influxdb
```
Create needed Influxdb databases ready.

```bash
influx
Connected to http://localhost:8086 version 1.8.3
InfluxDB shell version: 1.8.3
> create database jmeter
> create database icapserver
> exit

```
##Install grafana

```bash

 apt install net-tools

 sudo apt-get install -y gnupg2 curl  software-properties-common

 sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
 sudo apt-get update

 sudo apt-get -y install grafana

 sudo systemctl enable --now grafana-server

 systemctl status grafana-server.service 
```

 #Install Java

```bash
  sudo apt -y install openjdk-8-jdk
```

##Install useful tools
```bash
   apt -y install telnet
   apt -y install unzip
   apt -y install jq
```
##Install jmeter

```bash
mkdir /opt/jmeter
cd /opt/jmeter/
wget https://www.nic.funet.fi/pub/mirrors/apache.org//jmeter/binaries/apache-jmeter-5.3.zip

unzip apache-jmeter-5.3.zip 
```

## Install & Setup git
```bash
cd /opt
mkdir git
apt install git
```
Clone repo

```bash
cd git
git clone https://github.com/k8-proxy/aws-jmeter-test-engine.git
```
# Setting UP Generate Load ui

```bash
install node js
apt install nodejs -y
apt install npm -y
npm install -g @angular/cli
npm install -g http-server
```
-Install python

```bash
sudo apt update
sudo apt -y upgrade
sudo apt install -y python3-pip
sudo apt install -y build-essential libssl-dev libffi-dev python3-dev
```
-Install Flask

```bash
pip3 install Flask
pip3 install Flask-Cors
```
build UI:
```bash
   cd /opt/git/aws-jmeter-test-engine/UI/master-script-form
   npm install
   ng build --prod
```
Copy all UI files:

```bash
cd /opt/git/aws-jmeter-test-engine/UI/master-script-form/dist/master-script-form
cp * /var/www/html/
```

- Install apache
```bash
sudo apt update
sudo apt install apache2
sudo systemctl status apache2
sudo systemctl enable apache2
```
#Export EC2 as OVA.

-Ensure that aws cli v2 is setup with access to AWS. 
-S3 bucket is created 
-Attach an access control list (ACL) to your S3 bucket containing the following grants. 
-For Grantee, provide the appropriate Region-specific canonical account ID:
```bash
All other Regions
c4d8eabf8db69dbe46bfe0e517100c554f01200b104d59cd408e777ba442a322
```
-Create files.json with the following content:
```bash
{
    "ContainerFormat": "ova",
    "DiskImageFormat": "VMDK",
    "S3Bucket": "change-bucket-name",
    "S3Prefix": "vms/"
}
```
-run the following command
```bash
aws ec2 create-instance-export-task --instance-id instance-id --target-environment vmware --export-to-s3-task file://C:\file.json
```
More information about how to export EC2 as OVA can be found in:
https://docs.aws.amazon.com/vm-import/latest/userguide/vmexport.html
