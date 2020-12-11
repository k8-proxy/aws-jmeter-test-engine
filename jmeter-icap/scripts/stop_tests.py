import os
import subprocess
import stat

# runs a shell script containing command "killall -9 java"
def terminate_java_processes():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    script_path = os.path.join(dir_path, "stopTests.sh")
    os.chmod(script_path, 0o771)
    subprocess.Popen([script_path])
