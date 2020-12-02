# Angular UI Component Installation and Deployment

## Prerequisites

1. Download and install Node.js ([click here to download](https://nodejs.org/en/)). You can check if this was correctly installed by entering "node --version" in terminal.

2. Install Angular CLI using Node Package Manager (npm, already installed with Node.js in step 1). To do this, type in terminal (use sudo on linux systems):
```
npm install -g @angular/cli
```

The '-g' option is used to make the installation global, so it can be used anywhere and not just in the current folder. This process will take a little while. This can also be checked with "ng --version"

4. For back end, install Flask and dependencies (must have [python](https://www.python.org/downloads/) installed on machine). A requirements file is already set up and can be used to install the necessary packages:
```
pip install -r requirements.txt
```

## Setting up Project from Repository

To install the Angular project and all dependencies, navigate to the folder containing the project files in the repository: "(YourLocalRepository)/aws-jmeter-test-engine/UI/master-script-form". Once inside, enter in terminal:
```
npm install
```

This will automatically download all dependencies and setup files/folders required to test/develop/deploy this angular project. Once this is done, you can test the app by typing:
```
ng serve
```
In the terminal within the project folder shown above (it has to be inside that directory). This will boot up a test server at 'http://localhost:4200/' (this is just a test server and should not be used in production).

## Deploying Angular Project to Web Server

The project must first be built in order to be deployed. In the project directory, in the terminal, run:
```
ng build --prod
```

This will generate a folder in the project directory named "dist". Dist will contain another folder that holds the index.html page that will serve the application. See example path: "(localRepo)/aws-jmeter-test-engine/UI/master-script-form/dist/master-script-form".

## Running Backend Server

To run the backend, use:
```
python flask_server.py
```
However it is preferable to have this running as a service. See section below for information on how to do this.

## Setting Up Backend Server as a Service

This project comes with a file named "flask.service", this will need to be placed in a certain directory in the Ubuntu OS in order to run the flask server as a service. That directory is as follows:

```
/etc/systemd/system/
```

Flask.service's contents point to the directory where the rest of the project's python scripts exist:

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

See entries for *WorkingDirectory* and *ExecStart*. *WorkingDirectory* must point to the folder in the repo containing the python scripts (called "scripts" by default in the repository). The project also comes with an exec.sh file in "scripts" which contains the command used to run the flask server, and that is what *ExecStart* points to.

Once flask.service is put into "/etc/systemd/system/" and contains the correct directory information, it will have to be enabled then started.

To do this, run the following commands separately:

```
sudo systemctl enable flask
sudo systemctl start flask
```

The service should now be started and running in the background. Output from the flask server will not be sent to stdout or stderr (it runs silently). To check the output logs of the service as well as its status, use:

```
sudo journalctl -u flask
```
