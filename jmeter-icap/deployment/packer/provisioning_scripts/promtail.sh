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
