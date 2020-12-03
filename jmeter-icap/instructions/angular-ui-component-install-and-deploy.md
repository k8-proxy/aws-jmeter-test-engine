# Angular UI Component Installation and Deployment

## Prerequisites

Install Node.js

```bash
sudo apt install nodejs -y
sudo apt install npm -y
sudo npm install -g @angular/cli
sudo npm install -g http-server
```
Install python

```bash
sudo apt update
sudo apt -y upgrade
sudo apt install -y python3-pip
sudo apt install -y build-essential libssl-dev libffi-dev python3-dev
```

Install apache

```bash
sudo apt update
sudo apt install apache2
sudo systemctl status apache2
sudo systemctl enable apache2
```

For back end, install Flask and dependencies. A requirements file is already set up and can be used to get the necessary packages. Navigate to folder and install:

```
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
sudo pip3 install -r requirements.txt
```

## Setting up UI Project from Repository

To install the Angular project and all dependencies, navigate to the folder containing the project files in the repository and use npm like so:
```
cd /opt/git/aws-jmeter-test-engine/UI/master-script-form
sudo npm install
```

This will automatically download all dependencies and setup files/folders required to test/develop/deploy this angular project. It could take a couple of minutes to install.

## Deploying Angular Project to Web Server

The project must first be built in order to be deployed. In the project directory, in the terminal, run:
```
cd /opt/git/aws-jmeter-test-engine/UI/master-script-form
sudo ng build --prod
```

This will generate a dist folder that contains the files that need to be copied into the apache server.

```
sudo cp -a /opt/git/aws-jmeter-test-engine/UI/master-script-form/dist/master-script-form/. /var/www/html/
```

Now the UI should be accessible via the virtual machine's IP (i.e. http://virtual-macine-ip)

## Setting Up Backend Server as a Service

To setup the backend service, navigate to the folder containing the project files in the repository and copy the flask.service file to the system folder, and provide "exec.sh" with the correct permissions as shown below:
```
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
sudo chmod +x exec.sh
sudo cp flask.service /etc/systemd/system/
```

Flask.service's contents point to the directory where the project's python server scripts exist and to exec.sh, which runs those scripts. Please ensure that *WorkingDirectory* and *ExecStart* paths match the project repository path (they should by default):

```
# /etc/systemd/system/flask.service
[Unit]
Description=WSGI App for ICAP Testing UI Front End
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
ExecStart=/opt/git/aws-jmeter-test-engine/jmeter-icap/scripts/exec.sh
Restart=always

[Install]
WantedBy=multi-user.target
```


Once flask.service is put into "/etc/systemd/system/" and contains the correct directory information, it will have to be enabled then started.
To do this, run the following:

```
sudo systemctl enable flask
sudo systemctl start flask
```

Check if the service is running correctly using:

```
sudo systemctl status flask
```

The service should now be started and running in the background. To view this service's logs, use the following:

```
sudo journalctl -u flask
```
