# How to install and run InfluxDB, Grafana and Loki on Amazon Linux

## OS update
```bash
 sudo yum update -y
```
## Install InfluxDB and start service 

InfluxDB runs on port 8086

```bash
sudo wget https://dl.influxdata.com/influxdb/releases/influxdb-1.8.2.x86_64.rpm
sudo yum localinstall influxdb-1.8.2.x86_64.rpm -y
sudo service influxdb start
```
## Install Grafana and start service

Grafana runs on port 3000 
```bash
cat <<EOF | sudo tee /etc/yum.repos.d/grafana.repo
[grafana]
name=grafana
baseurl=https://packages.grafana.com/oss/rpm
repo_gpgcheck=1
enabled=1
gpgcheck=1
gpgkey=https://packages.grafana.com/gpg.key
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
EOF
```
```bash
sudo yum -y install grafana
sudo service grafana-server start
sudo chkconfig grafana-server on
```
## Install Loki and start service


```bash
cd /home/ec2-user
sudo wget https://github.com/grafana/loki/releases/download/v2.0.0/loki-linux-amd64.zip
sudo unzip loki-linux-amd64.zip 
sudo wget https://raw.githubusercontent.com/grafana/loki/master/cmd/loki/loki-local-config.yaml
sudo chmod a+x loki-linux-amd64
```
Create the following file:
```bash
sudo nano /etc/init.d/loki
```
and enter this and save the file:
```bash
#!/bin/sh
#
# example start stop daemon for CentOS (sysvinit)
#
# chkconfig: - 64 36
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 2 3 4 6
# Required-Start:
# description: example start stop daemon for CentOS
# processname: python
# pidfile: none
# lockfile: /var/lock/subsys/example

# Source function library.
. /etc/rc.d/init.d/functions

# Source networking configuration.
. /etc/sysconfig/network
# Check that networking is up.
[ "$NETWORKING" = "no" ] && exit 0

USER="root"
APPNAME="loki"
APPBIN="/home/ec2-user/loki-linux-amd64"
APPARGS="-config.file=/home/ec2-user/loki-local-config.yaml > /dev/null 2>&1"
LOGFILE="/var/log/$APPNAME/error.log"
LOCKFILE="/var/lock/subsys/$APPNAME"

LOGPATH=$(dirname $LOGFILE)

start() {
	[ -x $prog ] || exit 5
        [ -d $LOGPATH ] || mkdir $LOGPATH
        [ -f $LOGFILE ] || touch $LOGFILE

        echo -n $"Starting $APPNAME: "
        daemon --user=$USER "$APPBIN $APPARGS >>$LOGFILE &"
               RETVAL=$?
        echo
	[ $RETVAL -eq 0 ] && touch $LOCKFILE
        return $RETVAL
}

stop() {
        echo -n $"Stopping $APPNAME: "
        killproc $APPBIN
        RETVAL=$?
       echo
	[ $RETVAL -eq 0 ] && rm -f $LOCKFILE
        return $RETVAL
}

restart() {
        stop
        start
}
rh_status() {
        status $prog
}

rh_status_q() {
        rh_status >/dev/null 2>&1
}

case "$1" in
        start)
                rh_status_q && exit 0
                $1
        ;;
        stop)
                rh_status_q || exit 0
                $1
        ;;
        restart)
                $1
        ;;
        status)
                rh_status
        ;;
        *)
                echo $"Usage: $0 {start|stop|status|restart}"
                exit 2
esac

```
Make loki service executable and start the service
```bash
sudo chmod +x /etc/init.d/loki
sudo chkconfig loki on
sudo service loki start
```
# Verify that all are running

```bash
netstat -tulpn
```

```bash
[ec2-user@ip-172-31-83-255 ~]$ netstat -tulpn
(No info could be read for "-p": geteuid()=500 but you should be root.)
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address               Foreign Address             State       PID/Program name   
tcp        0      0 0.0.0.0:111                 0.0.0.0:*                   LISTEN      -                   
tcp        0      0 0.0.0.0:22                  0.0.0.0:*                   LISTEN      -                   
tcp        0      0 127.0.0.1:8088              0.0.0.0:*                   LISTEN      -                   
tcp        0      0 127.0.0.1:25                0.0.0.0:*                   LISTEN      -                   
tcp        0      0 0.0.0.0:34971               0.0.0.0:*                   LISTEN      -                   
tcp        0      0 :::58345                    :::*                        LISTEN      -                   
tcp        0      0 :::111                      :::*                        LISTEN      -                   
tcp        0      0 :::22                       :::*                        LISTEN      -                   
tcp        0      0 :::8086                     :::*                        LISTEN      -                   
tcp        0      0 :::3000                     :::*                        LISTEN      -
tcp        0      0 :::3100                     :::*                        LISTEN          
```
In above results, server is listening on ports 8086 (influxdb) , 3000(grafana) and 3100 (loki)

## HW requirements for Grafana & InluxDB & Loki setup

| vCPU     | RAM | IOPS     | Writes per second |Queries per second | Unique Series
| :----:   | :----:   |    :----: |:----:|:----:|:----:|
| 2-4      | 2-4 GB     | 500   |< 5000 | <5 |<100000|
| 4-6  | 8-32  GB      | 500-1000| <250 000| <25 |<1,000,000 |
| 8+ | 32+  GB      | 1000+| >250 000| >25 |>1,000,000 |

