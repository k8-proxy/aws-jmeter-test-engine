sudo apt install nodejs -y
sudo apt install npm -y
sudo npm install -g @angular/cli
sudo npm install -g http-server
sudo apt update
sudo apt -y upgrade
sudo apt install -y python3-pip
sudo apt install -y build-essential libssl-dev libffi-dev python3-dev
sudo apt update
sudo apt install -y apache2
sudo systemctl status apache2
sudo systemctl enable apache2
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts/
sudo pip3 install -r requirements.txt
cd /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form
sudo npm install
cd /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form
sudo ng build --prod
sudo cp -a /opt/git/aws-jmeter-test-engine/UI\ Scaled\ Solution/master-script-form/dist/master-script-form/. /var/www/html/
sudo systemctl stop apache2.service
sudo systemctl start apache2.service
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts/
sudo chmod +x exec_scaled.sh
sudo bash -c 'cat << EOF >> /etc/systemd/system/flask_scaled.service
[Unit]
Description=WSGI App for ICAP Testing UI Front End
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
ExecStart=/opt/git/aws-jmeter-test-engine/jmeter-icap/scripts/exec_scaled.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF'
sudo systemctl daemon-reload
sudo systemctl enable flask_scaled
sudo systemctl start flask_scaled
sudo systemctl status flask_scaled
sleep 10
sudo netstat  -ntlp
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
sudo bash -c "chmod +x changeIP.sh"
sudo cp changeIP.sh /etc/init.d/changeIP.sh
sudo ln -s /etc/init.d/changeIP.sh /etc/rc.d/
