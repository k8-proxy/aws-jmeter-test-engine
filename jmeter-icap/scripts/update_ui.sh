#!/bin/bash
echo "Fetching latest project files"
cd /opt/git/aws-jmeter-test-engine/ || { echo "Please make sure the project is cloned to /opt/git/"; exit 1; }
sudo git fetch --all
sudo git stash
sudo git reset --hard origin/master
cd /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form || { echo "UI scripts folder does not exist in specified path"; exit 1; }
echo "Installing Angular UI component"
sudo npm install
sudo ng build --prod
sudo cp -a /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form/dist/master-script-form/. /var/www/html/
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts || { echo "Scripts folder does not exist in specified path"; exit 1; }
echo "Setting executables"
sudo chmod +x exec_scaled.sh
sudo chmod +x stopTests.sh
sudo chmod +x changeIP.sh
echo "Running ChangeIP script"
sudo ./changeIP.sh
echo "Restarting services"
sudo systemctl stop apache2.service
sudo systemctl start apache2.service
sudo systemctl stop flask_scaled.service
sudo systemctl start flask_scaled.service
