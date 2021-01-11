#Grafana
sudo apt install net-tools
sudo apt-get install -y gnupg2 curl  software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
sudo apt-get update
sudo apt-get -y install grafana
sudo systemctl enable --now grafana-server
sudo systemctl restart grafana-server.service
sudo systemctl status grafana-server.service
sudo netstat -ntlp
sudo apt -y install openjdk-8-jdk
sudo apt -y install telnet
sudo apt -y install unzip
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts/
sudo cp config.env.sample config.env
sudo python3 create_grafana_api_keys.py
grep "GRAFANA_KEY" config.env
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts/
sudo python3 create_datasource.py