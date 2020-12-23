#Loki
cd /usr/local/bin
sudo curl -fSL -o loki.gz "https://github.com/grafana/loki/releases/download/v2.0.0/loki-linux-amd64.zip"
sudo gunzip loki.gz
sudo chmod a+x loki
#sudo wget https://raw.githubusercontent.com/grafana/loki/master/cmd/loki/loki-local-config.yaml
sudo wget -O loki-local-config.yaml https://gist.githubusercontent.com/shashanksinha89/a3f89c98b9f342d51b1250e02bb07150/raw/cd8a4cd0fce8054709308dca26d93752e98550a0/yaml
sudo useradd --system loki
sudo bash -c ' cat << EOF >> /etc/systemd/system/loki.service
[Unit]
Description=Loki service
After=network.target

[Service]
Type=simple
User=loki
ExecStart=/usr/local/bin/loki -config.file /usr/local/bin/loki-local-config.yaml

[Install]
WantedBy=multi-user.target
EOF'

sudo service loki start
sudo service loki status
sudo systemctl enable loki.service

#Influx
sudo apt-get update
sudo apt-get install c-icap -y

echo "deb https://repos.influxdata.com/ubuntu bionic stable" | sudo tee /etc/apt/sources.list.d/influxdb.list

curl -sL https://repos.influxdata.com/influxdb.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install influxdb
sudo systemctl start influxdb
sudo systemctl status influxdb
sudo systemctl enable --now influxdb

#Grafana
sudo apt install net-tools
sudo apt-get install -y gnupg2 curl  software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
sudo apt-get update
sudo apt-get -y install grafana
sudo systemctl enable --now grafana-server
sudo systemctl status grafana-server.service
sudo apt -y install openjdk-8-jdk
sudo apt -y install telnet
sudo apt -y install unzip

#Jmeter
sudo mkdir /opt/jmeter
cd /opt/jmeter/
sudo wget https://www.nic.funet.fi/pub/mirrors/apache.org//jmeter/binaries/apache-jmeter-5.3.zip
sudo unzip apache-jmeter-5.3.zip
cd /opt/jmeter/apache-jmeter-5.3/bin
sudo mkdir in
sudo mkdir out
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/test-data/
sudo unzip gov_uk_files.zip
cd gov_uk_files
sudo cp -R * /opt/jmeter/apache-jmeter-5.3/bin/in/
cd /opt
sudo mkdir git
sudo apt install git -y
cd git
sudo git clone https://github.com/k8-proxy/aws-jmeter-test-engine.git

#Promtail
cd /usr/local/bin
sudo curl -fSL -o promtail.gz "https://github.com/grafana/loki/releases/download/v1.6.1/promtail-linux-amd64.zip"
sudo gunzip promtail.gz
sudo chmod a+x promtail
sudo bash -c  'cat << EOF >> config-promtail.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0
positions:
  filename: /tmp/positions.yaml
clients:
  - url: http://127.0.0.1:3100/loki/api/v1/push
scrape_configs:
- job_name: glasswall_jmeter
  static_configs:
  - targets:
      - glasswall_jmeter
    labels:
      job: glasswall_jmeter
      __path__: "/opt/jmeter/apache-jmeter-5.3/bin/jmeter.log"
EOF'
sudo useradd --system promtail

sudo bash -c  'cat  << EOF >> /etc/systemd/system/promtail.service
[Unit]
Description=Promtail service
After=network.target

[Service]
Type=simple
User=promtail
ExecStart=/usr/local/bin/promtail -config.file /usr/local/bin/config-promtail.yml

[Install]
WantedBy=multi-user.target
EOF'

sudo service promtail start
sudo service promtail status
sudo usermod -a -G systemd-journal promtail
sudo touch /tmp/positions.yaml
sudo chown promtail:promtail /tmp/positions.yaml
sudo systemctl enable promtail.service


#
sudo bash -c "echo 'net.ipv4.ip_local_port_range = 12000 65535' >> /etc/sysctl.conf"
sudo bash -c "echo 'fs.file-max = 1048576' >> /etc/sysctl.conf"
#
sudo bash -c "echo '*           soft      nofile     1048576' >> /etc/security/limits.conf"
sudo bash -c "echo '*           hard      nofile     1048576' >> /etc/security/limits.conf"
sudo bash -c "echo 'root        soft      nofile     1048576' >> /etc/security/limits.conf"
sudo bash -c "echo 'root        hard      nofile     1048576' >> /etc/security/limits.conf"
#
#sudo sysctl -p
#
sudo useradd -p $(openssl passwd -1 glasswall) glasswall
sudo usermod -aG sudo glasswall
sudo sed -i "s/.*PasswordAuthentication.*/PasswordAuthentication yes/g" /etc/ssh/sshd_config
sudo service ssh restart