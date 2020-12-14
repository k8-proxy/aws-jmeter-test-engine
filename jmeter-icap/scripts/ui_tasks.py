import os
import subprocess

# runs a shell script containing command "killall -9 java"
def terminate_java_processes():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    script_path = os.path.join(dir_path, "stopTests.sh")
    os.chmod(script_path, 0o771)
    subprocess.Popen([script_path])


def modify_hosts_file(ip_addr: str):
    content = "127.0.0.1 localhost\n{0} www.gov.uk.local assets.publishing.service.gov.uk.local www.gov.uk assets.publishing.service.gov.uk.glasswall-icap.com".format(ip_addr)
    with open("/etc/hosts", "w") as f:
        f.write(content)
        f.close()
