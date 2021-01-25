#!/bin/sh
PUBLIC_IP=$(curl ifconfig.me)
PRIVATE_IP=$(hostname -I)
cd /var/www/html/
sudo sed -i "s/127.0.0.1/$PUBLIC_IP/g" main*
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
sudo sed -i "s/localhost/$PUBLIC_IP/g" config.env
sudo sed -i "s/127.0.0.1/$PRIVATE_IP/g" config.env
sudo systemctl stop apache2
sudo systemctl start apache2
sudo systemctl stop flask_scaled
sudo systemctl start flask_scaled

