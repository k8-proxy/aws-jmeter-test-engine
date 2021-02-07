#!/bin/bash
sudo git -C /opt/git/aws-jmeter-test-engine/ pull origin master
cd /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form || { echo "UI scripts folder does not exist in specified path"; exit 1; }
sudo npm install
sudo ng build --prod
sudo cp -a /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form/dist/master-script-form/. /var/www/html/
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts || { echo "Scripts folder does not exist in specified path"; exit 1; }
sudo ./changeIP.sh
sudo systemctl stop apache2.service
sudo systemctl start apache2.service
sudo systemctl stop flask_scaled.service
sudo systemctl start flask_scaled.service
