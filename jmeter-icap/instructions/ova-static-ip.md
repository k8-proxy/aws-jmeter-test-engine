## Steps

- Identify available network interface
  
  ```sh
   # ip link show

   1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
   2: ens32: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000 link/ether 00:0c:29:00:22:80 brd ff:ff:ff:ff:ff:ff
  ```
- Enable the network interface

```sh

# sudo ifconfig ens32 up
```

- Add below content to `/etc/netplan/50-cloud-init.yaml`. Mention network interface name and other network details accordingly.

```yaml
network:
    ethernets:
        ens32:
            addresses: [91.109.25.86/27]
            gateway4: 91.109.25.94
            nameservers:
              addresses: [8.8.4.4,8.8.8.8]
    version: 2
```
- Disable `cloud-init` network config. Add below setting to this file `/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg`

```json
network: {config: disabled}
```

- Once done run below commands to apply network changes

```sh
# netplan apply
# reboot
```
