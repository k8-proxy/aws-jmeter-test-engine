#Jmeter
sudo apt-get update
sudo apt install git unzip -y
sudo mkdir /opt/jmeter
cd /opt/jmeter/
sudo wget https://www.nic.funet.fi/pub/mirrors/apache.org//jmeter/binaries/apache-jmeter-5.3.zip
sudo unzip apache-jmeter-5.3.zip
cd /opt/jmeter/apache-jmeter-5.3/bin
sudo mkdir in
sudo mkdir out
cd /opt
sudo mkdir git
cd git
sudo git clone https://github.com/k8-proxy/aws-jmeter-test-engine.git
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/test-data/
sudo unzip gov_uk_files.zip
cd gov_uk_files
sudo cp -R * /opt/jmeter/apache-jmeter-5.3/bin/in/