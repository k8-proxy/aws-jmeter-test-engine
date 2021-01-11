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
sudo influx -execute 'create database jmeter'
sudo influx -execute 'create database icapserver'
sudo influx -execute 'SHOW DATABASES'