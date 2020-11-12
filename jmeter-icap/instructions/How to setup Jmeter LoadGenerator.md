## How to setup Jmeter LoadGenerator

## End 2 end flow vision
The end goal of the overall full solution is visioned to look like this:

![vm_load_vision](img/virtual_machine_based_load_vision.png)

In order to utilize full automated framework, there needs to be ready load generator AMI image with required software and tuning. The image then used together with CloudFormation to start needed number of EC2 Instances. 

## How to setup the Load Generator?

Note: These instructions are based on Amazon Linux.

The following needs to be in place by default in Load Generator image:

- Java version 8
- JMeter  
- ICAP Client
- Linux tuning & install useful applications

# Setup Java 8 in Amazon Linux

```bash
sudo yum -y install java-1.8.0-openjdk
sudo alternatives --config java
```
Simply enter the a selection number to choose which java executable should be used by default.
```bash
There are 2 programs which provide 'java'.

  Selection    Command
-----------------------------------------------
*  1           /usr/lib/jvm/jre-1.7.0-openjdk.x86_64/bin/java
 + 2           /usr/lib/jvm/jre-1.8.0-openjdk.x86_64/bin/java
```
enter 2.
Confirm that Java version is 8.

```bash
java -version
```
Output looks like this:
```bash
[ec2-user@ip-10-112-4-96 ~]$ java -version
openjdk version "1.8.0_265"
OpenJDK Runtime Environment (build 1.8.0_265-b01)
OpenJDK 64-Bit Server VM (build 25.265-b01, mixed mode)
```
# Setup Jmeter Amazon Linux

```bash
cd /home/ec2-user/
wget https://www.nic.funet.fi/pub/mirrors/apache.org//jmeter/binaries/apache-jmeter-5.3.zip
unzip apache-meter-5.3.zip
```
create necessary in and out folders:
```bash
mkdir /home/ec2-user/apache-jmeter-5.3/bin/in
mkdir /home/ec2-user/apache-jmeter-5.3/bin/out
```

# Setup ICAP Client

Reference : https://github.com/filetrust/program-icap/wiki/Using-the-C-ICAP-Test-Client

Use the following commands to setup icap client in the load generator machine:

```bash
sudo yum install git -y sudo yum install gcc doxygen make automake automake 1.11 -y sudo yum install automake1.11 -y 
cd
git clone https://github.com/filetrust/mvp-icap-service.git
cd mvp-icap-service/
cd c-icap
aclocal
autoconf
automake --add-missing
./configure --prefix=/usr/local/c-icap
sudo make install
cd ..
cp c-icap/ltmain.sh c-icap-modules/
cd c-icap-modules/
aclocal
autoconf
automake --add-missing
./configure --with-c-icap=/usr/local/c-icap --prefix=/usr/local/c-icap
sudo make install
sudo /usr/local/c-icap/bin/c-icap -N -D -d 10
```
# Linux tuning & install useful applications

Ulimit tuning.

In order to be able to generate high traffic, there is a need to tune Linux ulimit parameters:

sudo nano /etc/security/limits.conf
 Edit the following file
 ```bash
 sudo nano /etc/sysctl.conf
```
Add & save:
```bash
net.ipv4.ip_local_port_range = 12000 65535
fs.file-max = 1048576
```
Edit the following file:
 ```bash
sudo nano /etc/security/limits.conf
```
Add & Save:
```bash
*           soft      nofile     1048576
*           hard      nofile     1048576
root        soft      nofile     1048576
root        hard      nofile     1048576
```

Reboot & Confirm that changes are in effect:
```bash
[root@ip-10-112-4-96 ec2-user]# ulimit -n
1048576
```

Install useful applications

```bash
sudo yum -y install telnet
sudo yum -y install jq 
```