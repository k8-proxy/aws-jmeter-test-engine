# How to generate load with OVA ?

This instruction assumes that Load Generator OVA is deployed to Vmware as Virtual Machine using provided instructions. See this link how to deploy OVA: https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/instructions/How-to-Deploy-OVA.md

The load generator comes with 2 features:

- Load Generation Capability
- Performance Dashboard


## 1. How to use load generation capability

Load generation can be triggered via provided UI interface.

UI interface looks like this and accessible via http://virtual-machine-ip

![vm_load_vision](img/Load-Generator-UI.png)

The Load Generator UI form has the following options:

- Total Users: 
    - How many total concurrent requests would you like to send? Default: 25
    - Maximum number of total users depends on the Virtual Machine resources:

| vCPU     | RAM | Total Users    | 
| :----:   | :----:   |    :----: |
| 2-4      | 2-4 GB     | 50-500   |
| 4-6  | 8-16  GB      | 500-1000| 
| 8+ | 32+  GB      | 4000| 

- Rampup time: How fast you would like to ramp up total users? Default is 300.
- Duration: How long would you like to generate load? Default is 900
- Load Type: It is possible to generate load directly to ICAP Server or to a Proxy site
- ICAP/Proxy end point URL: end point url against which load should be run.
- Prefix: prefix is used to distinquish different dashboards and measurements. For different kind of load scenarios it is good to use their own prefix so that dashboard view would be unique for that specific scenario

## How to generate load?

Load generation process is simple:

- Ensure that target application under test is up and running
- Open browser and access Load Generation UI http://virtual-machine-ip
- Enter load scenarios based on above description
- Click on Generate Load
- Dashboard link will be shown in the page

![vm_load_vision](img/Dashboard-Link.png)

## How to use performance dashboard?

After you click Generate Load button, dashboard link for that specific prefix will be shown in the page.

![vm_load_vision](img/Load-generator-sample.png)

Click that link and it will open dashboard login page:

![vm_load_vision](img/Grafana-login.png)

Enter admin/glasswall and then dashboard ui will be visible with your own set prefix:

![vm_load_vision](img/Dashboard-sample.png)

Note: Ensure that only one test scenario is running at a time. 
Note: Log panel in performance dashboard will show traffic log lines in coming releases.
Note: if you would like to stop the test, ssh to VM and find the java process pid , for example, by "top| grep java" commmand and kill it "sudo kill pid"

