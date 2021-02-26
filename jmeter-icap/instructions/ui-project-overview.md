# AWS Jmeter Test Engine UI and Python Scripts Overview

- [AWS Jmeter Test Engine UI and Python Scripts Overview](#aws-jmeter-test-engine-ui-and-python-scripts-overview)
  * [Introduction](#introduction)
  * [Architecture Overview](#architecture-overview)
      - [ICAP Performance Testing Form](#icap-performance-testing-form)
      - [Setup Form](#setup-form)
      - [Admin Page](#admin-page)
      - [Flask Server](#flask-server)
  * [Programmer's Guide to Project Components](#programmer-s-guide-to-project-components)
    + [Angular UI](#angular-ui)
      - [The Common Folder](#the-common-folder)
        * [AppSettings.ts](#appsettingsts)
        * [load.pipe.ts](#loadpipets)
        * [shared.service.ts](#sharedservicets)
        * [ConfigFormValidators.ts](#configformvalidatorsts)
      - [Angular Components](#angular-components)
        * [config-form](#config-form)
        * [setup-form](#setup-form)
        * [tests-table](#tests-table)
        * [results-table](#results-table)
        * [admin](#admin)
        * [navbar](#navbar)
    + [Python and Shell Script Components](#python-and-shell-script-components)
      - [flask_server.py and flask_server_scaled.py](#flask-serverpy-and-flask-server-scaledpy)
      - [create_stack.py](#create-stackpy)
      - [create_dashboard.py](#create-dashboardpy)
      - [create_stack_dash.py](#create-stack-dashpy)
      - [ui_tasks.py](#ui-taskspy)
      - [ui_setup.py](#ui-setuppy)
      - [database_ops.py](#database-opspy)
      - [run_local_test.py](#run-local-testpy)
      - [changeIP.sh](#changeipsh)
  * [Troubleshooting](#troubleshooting)
    + [Generate Load is clicked, but gets stuck at "Generating Load..." or displays error message](#generate-load-is-clicked--but-gets-stuck-at--generating-load--or-displays-error-message)
    + [Flask service shows that it is stopped/failed](#flask-service-shows-that-it-is-stopped-failed)
    + [Generate Load works, but Grafana Dashboard does not display any metrics](#generate-load-works--but-grafana-dashboard-does-not-display-any-metrics)
  * [Miscellaneous Information](#miscellaneous-information)
    + [Adding a new parameter to the Project](#adding-a-new-parameter-to-the-project)
    + [Adding new dashboard templates](#adding-new-dashboard-templates)
    + [Adding a new Load Type](#adding-a-new-load-type)
    + [Details to note](#details-to-note)

## Introduction

This document aims to assist anyone who wishes to learn about, use, or modify the AWS Jmeter Test Engine UI and associated python scripts. It mainly targets the Scaled Solution UI, but much of it is also applicable to the OVA's version of the UI as well. It will begin with an overview of the project's components followed by a more detailed analysis of those components, a programmer's guide, a troubleshooting section, and a miscellaneous notes section.

## Architecture Overview

The overall UI component consists of a front end browser-based UI created using the Angular framework and a Python based back end Flask server. This section details what these systems consist of and how they interact with each other.

The front end contains two forms, one for ICAP performance testing, the other for setting up/changing server-side environment variables. The form used to submit tests includes a table that lists currently running tests as well as a results table that shows the last 10 tests that were run. Both tables include links to Grafana dashboards along with test details, however the results table contains significantly more information on tests. There is also an admin page that contains a button used to update the project to the latest version from the repository, but it is not displayed on the navbar (it can be accessed by using /admin at the end of the home link). A detailed analysis of the components introduced above can be seen in the following two sections.


#### ICAP Performance Testing Form

This is the home page of the UI and contains most of its primary functionality. Whenever this form is submitted, it makes a POST request to the server containing all the fields the user entered. These details are then passed to the appropriate python scripts that will trigger load generators. Once load has been triggered, the server responds back to the front end with a link to a Grafana dashboard associated with that test and the name of the stack created. The reason the stack name is provided is because it is used to uniquely identify that individual test and to allow the "stop test" button to target only that test (in the OVA, this functionality is limited to a single button that stops all tests).

The front end stores the server's response in a browser-based cookie, and the currently running tests list is populated using those cookies. These are convenient because they can be set to expire after the test duration ends, thus allowing for easy removal from the currently running tests list. They also make it so that currently running test information is isolated to the machine that triggered those tests, preventing situations where multiple users running tests may influence each other's tests.

#### Setup Form

This form contains fields for some of the more commonly changed environmental variables found in the config.env file (which should be created in the scripts folder of this project's repository). Its aim is to provide an easy way of modifying these config.env values without the need to ssh into the machine containing the config.env file.

The setup form is designed so that as soon as it is navigated to, it sends a GET request the back end server to retrieve the existing values of its fields. For example, there is a field for "Test Data Bucket" in the form; if the name of the current test data bucket is "gw-test-data-0137" in the config.env file, the field for "Test Data Bucket" will start off populated with that value in the setup form.

Upon submission of the form, a POST request is made to the Flask server back end and the config.env file's contents are modified to include the values the user has entered.

#### Admin Page

This is not included in the UI's navbar, but can be accessed using the domain name followed by "/admin", where the home page will typically end with a "#/" symbol. It includes only one button that will update the project. This button triggers a shell script that will download the latest project files, build the angular component, transfer it to apache server, update the IP address, and restart the services the project uses.

#### Flask Server

This component receives the different requests/forms from the previous two components and calls the necessary python scripts/methods required to process those requests. Its main functions are to trigger load, stop tests, update the config.env file, update the project, and upload csv test file lists files to the appropriate locations. All of these tasks are performed depending on input received from the front end UI buttons and forms.

## Programmer's Guide to Project Components

This section will list the various components associated with the UI/Flask server, as well as notes how each part operates. It details each piece of this project and gives tips on how it can be extended/modified to suit end user needs. It assumes the programmer has basic knowledge of both Angular and Python. It is meant to be used as a reference manual along with the code.

### Angular UI

The "app" folder of the Angular UI component contains the main front end project files, and it will be the focus of this section. It consists of 6 subfolders: 1 "common" subfolder for services/settings and 5 component folders. All of these components will be listed below along with general notes on how they operate. The UI uses Bootstrap for its theme/appearance.

#### The Common Folder

This contains four subfolders for app settings, pipes, services, and validators. Each of these folders contains a typescript file, and these are listed below and explained in detail as required.

##### AppSettings.ts

This contains static data that is accessed by other components. When adding load types, descriptions, dashboard names, etc, the arrays in this class will need to be modified to reflect those changes. __The following are are some very important notes to understand relating to this file__:

- __The loadTypeNames array__: This contains strings representing load type names. These strings should not be changed unless the programmer intends to modify the back end as well. They serve 2 purposes, the first is to be displayed/listed in the front end ICAP Testing form, the second is to be sent to the back end for processing. The back end looks specifically for those strings, as they are enumerated (in the form of strings) in the python class named [ui_tasks.py](https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/scripts/ui_tasks.py). For example, in the case of the "Direct" load type, the back end will looks for the string "Direct" to be sent to it. That string's origins are the AppSettings.ts file. If the name must be modified for display purposes, an Angular pipe can be used. It so happens that one such pipe is already in use for the "Direct" load type; the front end displays it as "Direct ICAP Server" in the load types dropdown list, but internally, it's passed around as "Direct". This is *not* the case for the other load types at the time of this file's creation. So if a change must be made to this array, it must be noted that the same change will need to be made in ui_tasks.py.

- __The LoadTypes enum__: A lot of components refer to what the current load type is to determine what they should display. For instance, if the load type is "Direct", we choose the dashboard name based on that, the test name, field descriptions, example field placeholders, etc. As such, the arrays containing this data need to be in sync with the LoadTypes enum. This means that their contents need to be in the same order as the contents of the LoadTypes enum. These arrays are loadTypeNames, endPointFieldTitles, endPointFieldPlaceholders, testNames, and dashboardNames. This will be highlighted below:

```
    export enum LoadTypes { Direct = 0, ProxySharePoint, DirectSharePoint, RestApi, ProxyOffline }
    public static loadTypeNames: string[] = ['Direct', 'Proxy SharePoint', 'Direct Sharepoint', 'REST API'];
    public static endPointFieldTitles: string[] = ["ICAP Server Endpoint URL*", "SharePoint Endpoint URL*", "SharePoint Endpoint URL*", "REST API Endpoint*", "Proxy IP Address*"];
    public static endPointFieldPlaceholders: string[] = ["Ex: icap-client.region.app.provider.com", "Ex: saas1.sharepoint.com", "Ex: saas1.sharepoint.com", "Ex: http://host.domain/api/"]
    public static testNames: string[] = ["ICAP Live Performance Dashboard", "SharePoint Proxy Live Performance Dashboard", "SharePoint Direct Live Performance Dashboard", "REST API Live Performance Dashboard" ,"Proxy Site Live Performance Dashboard"];
    public static dashboardNames: string[] = ["-icap-live-performance-dashboard", "-demo-dashboard-sharepoint", "-sharepoint-direct-live-performance-dashboard", "-rest-api-live-performance-dashboard", "-proxysite-live-performance-dashboard"];
```

In the code above, the first elements of loadTypeNames, endPointFieldTitles, endPointFieldPlaceholders, testNames, and dashboardNames all correspond to the first element "Direct = 0" of the LoadTypes enum shown above them (in the actual code, that is not where the enum is located, but this is for demonstration purposes). The same applies to the other load types. To give an example, we have the endPointFieldTitles array shown above. The second and third elements are the same. The reason for this is that both those load types happen to have the same end point field titles; they are repeated in the array because their positions must correspond to the position of their respective loadtypes in the LoadTypes enum, and this forces duplication. The same situation can also be seen in the endPointFieldPlaceholders array as well, we have a case where duplication is forced to preserve the correct order based on the LoadTypes enum. The reason for this design decision is so that reference to these various array elements can be made throughout the project in a readable manner using the enum.

##### load.pipe.ts

This contains a pipe that can be used to display the "Direct" load type as "Direct ICAP Server" in the HTML. It can be extended to operate similarly for other load types if their display names require modification. It was created to preserve the state of the loadTypeNames array in AppSettings.ts, because its contents should not be modified unless the same modification will be made in the ui_tasks.py class at the back end (see the AppSettings.ts section above for more information).

##### shared.service.ts

This service does a lot of the work required to pass data around to the various components of the project. It is responsible for the following:

- Creating test names for display
- Generating dashboard names for display
- Building rows for the tables that will display tests
- Retrieves data from the back end for the "Test Results" table
- Contains events for when a test form is submitted, a setup form is submitted, a test (one or many) is stopped, and when data retrieval for results table is complete. Other components subscribe to these events to either process data or perform necessary operations to update the UI based on these events.

##### ConfigFormValidators.ts

This contains the various custom validators that have been used as the project progressed. They will not be listed here as they are self explanatory, however in the case of the "cannotContainDuplicatePrefix" validator, it uses a set in AppSettings.ts (testPrefixSet) to keep track of the prefixes that are currently in use. As of the writing of this document, this validator is not currently in use.

#### Angular Components

##### config-form

This is the component for the main page of the UI that contains the ICAP Performance Test form. It is a reactive form that contains logic that manipulates the form's options based on the load type selected. It reads load types from AppSettings.ts and may set or remove validators for certain fields depending on the load type selected.

It is worth mentioning here that the form field for "icap_server_endpoint" represents all endpoint fields, even for other load types. So in the back end, end point fields are sent as "icap_server_endpoint" even if that is not technically the exact endpoint type they represent.

When a form is submitted, the form's contents are packed into a "FormData" object and sent to the Flask server.

##### setup-form

This component is used to change configurations/environment variables in the config.env file. It contains the following functionality:
1. It allows for changing a limited number of fields in config.env and the Config object that exists in the currently running server.
2. It auto populates its fields using existing values from the current config.env file to give users and idea of what is currently there. It does this via a GET request that is made to the back end as soon as the page is navigated to.
3. It allows the automatic upload of test data to the Test Data S3 bucket if that data is not already there.
4. It allows the upload of csv test file lists to all the test directories associated with each load type.
5. It can return with one of three possible results: Failure, Success, and PartialSuccess. Failure means none of the config.env values were updated, nothing was uploaded. Success means everything succeeded. Partial success means that config.env values did indeed get updated, but upload to S3 failed.

The methods associated with this form's functionality in the back end are located in the [ui_setup.py](https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/scripts/ui_setup.py) file of the project.

##### tests-table

When a test is triggered, it is automatically added to a "Currently Running Tests" table, and this component is responsible for displaying that. Test data is generated using a mix of user input at the front end as well as the server response (containing stack name and Grafana dashboard link) from the back end. This information is stored in a cookie that is set to expire after the test duration completes. The value for test duration is gotten from the "Duration" field, which is given in seconds. Every second, the list does a check on the current cookies available, and if any have expired, it will remove those test entries from the table.

This component is also responsible for handling requests to stop tests via the "stop test" button that appears next to each running test on the table (only in scaled UI, in OVA, we have a universal "Stop Load" button that stops all currently running tests).

##### results-table

The results table is responsible for displaying the results stored in the database to users at the front end. It subscribes to database retrieval events in shared.service.ts, which sends a GET request to the back end every minute. The shared.service.ts class also organizes the data into "ResultsRowElement" rows before passing them to the results-table component, which simply organizes the results and displays them.

##### admin

This is a page for adding any administrative tasks related to the UI. As of the writing of this document, it only contains a button for updating the project. This sends a POST request to the server which then runs a shell script named "ui_update.sh". That, in turn, fetches the latest project files, installs the Angular UI component, sets the correct permissions for the various executables the project uses, and finally restarts the apache and flask services. It also displays messages depending on update success or failure.

##### navbar

A basic Bootstrap navbar component, contains navigation tabs for ICAP Performance Testing and the Setup form.

### Python and Shell Script Components


#### flask_server.py and flask_server_scaled.py

These represent the Flask server back end. They are both very similar in implementations, but "flask_server.py" is used with the OVA, while "flask_server_scaled.py" is used for the scaled solution. The server receives POST and GET requests from the front end and triggers the corresponding scripts.

The forms sent from the UI (packed into a FormData object) are unpacked by the Flask server into a JSON representation, and depending on their contents, this script will call the necessary scripts. For example, if the request is from the Setup form, and it contains a file, the method for handing file uploads will be called along with the method that updates the config.env file. It also looks for 'button' in the JSON object (which represents a form submitted via the front end) to determine what the request is. The "button" attribute can contain "generate_load", "stop_individual_test", "setup_config", or "update" for those tasks.

This class also contains the array of repository folders that uploaded csv files get copied to. If a new folder for a new load type is added, it will need to be inserted into this array.

#### create_stack.py

Responsible for creating the StartExecution script that will be uploaded to the script bucket and starting the load generators that will push data to the database for display on Grafana dashboards. An important thing to note is that this class also houses the Config object used throughout this project's modules. The Config object loads parameters from the config.env file when the script is first run, and whenever config.env's contents are changed, a restart of the flask server is required (unless the change was made via the UI's Setup page, in which case no restart is required).

Whenever a new parameter is to be added to the project, the programmer should start by adding it to the Config object in create_stack.py.


#### create_dashboard.py

This is responsible for creating dashboards. In the case of execution from the UI, it will create dashboards in the Grafana instance running on the same machine as the server, but will use that server's public IP to provide the dashboard link back to users. This is why the parameter "GRAFANA_URL" should contain the public IP of the machine hosting the Grafana instance.

This class also modifies dashboard contents in a limited capacity (for example modifying test run information in the JSON template before creating the dashboard). It also adjusts dashboard templates that might be missing required tags and ensures the dashboard template contains both id and uid attributes, and that those attributes are set to null (this is required when creating Grafana dashboards using JSON templates).

#### create_stack_dash.py

This is the master script of this framework responsible for orchestrating load generation by calling whatever scripts are required for both that and dashboard creation. [A more detailed look at this class can be seen in the instructions file created for it.](https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/instructions/how-to-use-create_stack_dash.md)

The class can be split into three major sections. The first contains a fairly lengthy list of parameters that can be input via running this class from the CLI (under a method called "__get_command_line_args()"). The second contains the various methods that call the scripts that generate load (create_stack.py) and generate dashboard (create_dashboard.py). The final part is the method called when it is run from CLI. It contains a list of assignment statements that serve to prioritize CLI input over config.env parameters (this is explained in more detail in instructions file linked above).

To add parameters to this project, you would need to add them the __get_command_line_args method and ensure they get assigned in the main method that is run via the CLI (the final method in the file). Parameters would also need to be added to create_stack.py (see the create_stack.py section above for more information).

#### ui_tasks.py

This is a utility class that contains all the methods used for processing input that comes from the UI. This class also assigns the test directory, jmx script, grafana template, and csv test list file depending on the load type. So if changes need to be made to the dashboard/scripts/folders used with the UI, the "determine_load_type" method would be where those modifications can be made.

#### ui_setup.py

This contains the methods used when the setup form is submitted from the UI. It updates both the Config object as well as the config.env file with newly input parameters. It also saves uploaded csv files to each of the folders containing the different scripts/dashboards for the various load types.

#### database_ops.py

This contains methods used for obtaining test results from the database to be displayed in the UI front end. It works in unison with metrics.py to store and receive metrics.

#### run_local_test.py

This serves a very similar purpose to create_stack_dash, but is used only in the OVA to start load generation locally.

#### changeIP.sh

This script changes the IPs in the project to match those of the machine it is currently running on. It does this in two places: The /var/www/html folder containing the UI front end and the scripts folder containing config.env.

It is very important to note that this script will only function correctly if the following conditions are met:
1. The Angular UI project was built with the following IP value in AppSettings.ts:
```
public static serverIp: string = "http://127.0.0.1:5000/";
```

2. The config.env contains the following two parameters exactly as they are written below:
```
INFLUX_HOST=127.0.0.1
GRAFANA_URL=localhost:3000
```

If those values have been changed due to a previous run, they will need to be modified to look exactly like the above. In the case of the Angular project, the serverIp value in AppSettings.ts must be changed and the project rebuilt and copied to /var/www/html before running changeIP.sh again.

## Troubleshooting

### Generate Load is clicked, but gets stuck at "Generating Load..." or displays error message

Most of the time, this is and issue related to parameters in the config.env file that are either invalid or missing. These are the most common issues ones:
- The Grafana API key is invalid or expired
- The Grafana URL does not end with the correct port (i.e. ":3000")
- Incorrect IPs are used for Grafana/InfluxDB
- AWS profile is not setup or USE_IAM_ROLE=yes is missing/set to "no"

Other possible reasons unrelated to the config.env file are:
- The front end and back end are not connected. This could be due to a change in IP address. The UI front end relies on its machine's public IP to connect to itself. This IP can be found in "AppSettings.ts", and can be set using "changeIP.sh" (please see the section on changeIP.sh on how to do this). A useful way to test this is to stop the flask server currently running using the following for the scaled solution then start it up from the scripts folder to see any error output it may provide:
```
sudo systemctl stop flask_scaled.service
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
sudo python3 flask_server_scaled.py
```
For OVA:
```
sudo systemctl stop flask.service
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
sudo python3 flask_server.py
```

Once the server is running, requests can be sent to it via the UI. If no info messages are displayed from the currently running server, it is most likely the case that the UI front end is not connecting to the server. If errors are displayed, it means it is connected, and those errors may point to which config.env parameters are incorrect or missing.

### Flask service shows that it is stopped/failed

This can occur due to the following reasons:

1. The executable files of the project do not have the correct permissions set. The correct execution permissions need to be set for the shell scripts responsible for starting the server:
```
cd /opt/git/aws-jmeter-test-engine/jmeter-icap/scripts
sudo chmod +x exec.sh
sudo chmod +x exec_scaled.sh
sudo chmod +x stopTests.sh
sudo chmod +x update_ui.sh
```

2. A parameter in config.env is incorrect/missing. See the previous section for more information.

### Generate Load works, but Grafana Dashboard does not display any metrics

The Grafana dashboard uses InfluxDB as its datasource. If for any reason that data source is not receiving metrics, the dashboard will remain blank. Possible reasons for this are:

1. The incorrect IP is used for "INFLUX_HOST". When used from a virtual machine or EC2 server, the INFLUX_HOST value must contain the *private* IP of the machine, not the public one.

2. When running from CLI, this can occur when the "TEST_DATA_FILE" parameter is pointing to an incorrect file name. For example, it contains "files.csv", but the actual name that should be there is "gov_uk_files.csv".

## Miscellaneous Information

This section provides various notes and tips for users/programmers who might wish to use/modify the project.

### Adding a new parameter to the Project

To add a new parameter to the project, the following steps will need to be taken.

1. In create_stack.py, the parameter must be added to the Config object declared at the top of the file.
2. In create_stack_dash.py, the parameter should be added to the parameter list at the top of the file. It should also be assigned in the method at the end of the file which loads argument parameters into the Config object before execution from the CLI.
3. Any functionality it serves must be added to the body of whatever method related to that new parameter, or to a completely new method that implements the desired functionality.
4. If the parameter is to be added to the UI Testing or Setup forms, it will need to be added as a FormControl in the Angular FormGroup objects associated with those components (configForm and setupForm in the component typescript files). Then the corresponding getter methods should be created along with whatever HTML is necessary for the new field.

### Adding new dashboard templates

Often when a template is copied over, it is from a dashboard that was created during a test and modified. This could result in that previous test's prefix occurring all over the dashboard template. Before using, make sure that no pre-existing occurrences of prefixes remain in the template, usually this involves a remove/replace of "prefix_". That is the prefix followed by an underscore character.

When it comes to running the project from the UI, depending on the load type, a different file is chosen for the dashboard. This file is identified by name in the "determine_load_type" method of ui_tasks.py, and example from the code is shown below:
```
config.grafana_file = 'aws-test-engine-dashboard.json'
```

 If a new dashboard template is chosen, one of the following two options methods can be used:

1. Go to the folder associated with the load type. Overwrite the existing dashboard template with the new template taking care to preserve the naming of the file.

or

2. Go to the folder associated with the load type and add the new dashboard template there. Change the name referring to that file in the "determine_load_type" method in ui_tasks.py. Note that future dashboard templates will either need to follow this new naming or it can be changed again in the ui_tasks.py class.

### Adding a new Load Type

To add a new load type, the following steps will need to be taken:

At the python back end:

1. The load type should be added to the LoadType enum in ui_tasks.py
2. A folder should be created for that load type containing the associated scripts, dashboard templates, and csv files. Config.env will look into this folder using the "TEST_DIRECTORY" variable.
3. In ui_tasks.py, and entry for this new load type should be added in the "determine_load_type" with assignments done in the same manner as other load types there.

At the Angular UI front end:

1. The load type will need to be added in the AppSettings.ts file. It is __required__ that entries for the load type are added to the following lists in the AppSettings.ts file (please see the section in that file for a detailed explanation on this point):
  - LoadTypes enum
  - loadTypeNames array
  - endPointFieldTitles
  - endPointFieldPlaceholders
  - testNames
  - dashboardNames

  Care must also be taken to preserve the ordering of the elements in these lists, as is highlighted in the section dedicated to AppSettings.ts in the Programmer's guide.
2. Once added to the above arrays, the UI should automatically incorporate the new load type provided no new fields are needed along with it (i.e. it only requires an end point). If it has additional requirements, those will need to be manually implemented. An example of this can be seen in the Proxy SharePoint load type; an extra field will appear if that load type is selected and it has its own validators that are assigned/removed whenever the load type is selected/deselected.


### Details to note

- In the config.env file, the INFLUX_HOST parameter must be the *private* IP of the machine it is running on. In cases where tests are being run from a local machine to an EC2 instance containing this project's AMI, the "INFLUX_PUBLIC_IP" will need to be used for database transactions between the server and UI. The private IP will still be needed for transactions between jmeter and InfluxDB.

- In the config.env file, the "GRAFANA_URL" entry must end with the port value, typically 3000, as shown below:
```
GRAFANA_URL=localhost:3000
```
- In the OVA, scripts and dashboard files are not read from the repo, but from a folder located at:
```
/opt/jmeter/apache-jmeter-5.3/bin/
```
This means that new dashboard/script/csv files must be added there rather than in the test directories used in the scaled solution.
