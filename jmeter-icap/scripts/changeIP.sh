#!/bin/sh
PUBLIC_IP=$(curl ifconfig.me)
cd /var/www/html/
sudo sed -i "s/127.0.0.1/$PUBLIC_IP/g" main*
#cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
#sudo sed -i "s/127.0.0.1/$PUBLIC_IP/g" run_local_test.py
sudo systemctl stop apache2
sudo systemctl start apache2
sudo systemctl stop flask_scaled
sudo systemctl start flask_scaled
