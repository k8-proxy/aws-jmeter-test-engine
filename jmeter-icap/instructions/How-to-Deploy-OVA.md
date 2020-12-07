# How to deploy ICAP Performance Traffic Generator OVA to VMware ?

Step 1. Download OVA from https://glasswall-sow-ova.s3-eu-west-1.amazonaws.com/vms/Traffic-Generator/Traffic-Generator.ova

Step 2. Login to VMware and 

Step 3. Create new VM from OVA:

![vm_load_vision](img/newVM-ova.png)

Step 4: Give Name to the VM

![vm_load_vision](img/OVAVMName.png)

Step 5. Click Next until Finish button appears

Step 6. Click Finish button

Step 7. Wait until VM is ready. 

Step 8. Once VM is ready, you can modify the vCPU and Ram by shutting down the VM and then going to Actions -> Edit Settings. We recommend at least setting vCPU to 4 and 6GB of RAM.
![vm_load_vision](img/VM-Memory-Change.png)

Step 9. Login to VM with glasswall/glasswall credentials and remember to change password

Step 10. Assign Static IP address by following : https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/instructions/ova-static-ip.md

Step 11. Run the following shell script to change IP address to correct places:

```bash
cd /opt/script
sudo ./changeIP.sh
```
Next, please, follow https://github.com/k8-proxy/aws-jmeter-test-engine/blob/master/jmeter-icap/instructions/How-to-Generate-Load-with-OVA.md this to be able to generate load.

