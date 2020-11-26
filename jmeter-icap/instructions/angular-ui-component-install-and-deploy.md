# Angular UI Component Installation and Deployment

## Prerequisites

1. Download and install Node.js ([click here to download](https://nodejs.org/en/)). You can check if this was correctly installed by entering "node --version"

2. Install Angular CLI using Node Package Manager (npm, already installed with Node.js in step 1). To do this, type in terminal (use sudo on linux systems):
```
npm install -g @angular/cli
```

The '-g' option is used to make the installation global, so it can be used anywhere and not just in the current folder. This process will take a little while. This can also be checked with "ng --version"

3. Install http-server:
```
npm install -g http-server
```

This is a really fast and easy way to get a server up and running from the project's production build folder. Alternatively, an Apache web server could also be used.

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

### Deployment Using

Navigate to the master-script-form folder in dist and start the server by simply entering "http-server":

```
cd dist/master-script-form
http-server
```

This will start the server from this directory, typically served on http://localhost:8080/

Accessing the above link should take you directly to the UI front end of the application.
