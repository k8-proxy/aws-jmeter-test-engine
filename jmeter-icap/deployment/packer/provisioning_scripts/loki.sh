#Loki
sudo apt install net-tools -y
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
sudo systemctl restart loki.service
sudo netstat -ntlp
sudo systemctl enable loki.service