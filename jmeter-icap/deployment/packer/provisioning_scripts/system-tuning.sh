sudo bash -c "echo 'net.ipv4.ip_local_port_range = 12000 65535' >> /etc/sysctl.conf"
sudo bash -c "echo 'fs.file-max = 1048576' >> /etc/sysctl.conf"
#
sudo bash -c "echo '*           soft      nofile     1048576' >> /etc/security/limits.conf"
sudo bash -c "echo '*           hard      nofile     1048576' >> /etc/security/limits.conf"
sudo bash -c "echo 'root        soft      nofile     1048576' >> /etc/security/limits.conf"
sudo bash -c "echo 'root        hard      nofile     1048576' >> /etc/security/limits.conf"
#
#sudo sysctl -p
#
sudo useradd -p $(openssl passwd -1 glasswall) glasswall
sudo usermod -aG sudo glasswall
sudo sed -i "s/.*PasswordAuthentication.*/PasswordAuthentication yes/g" /etc/ssh/sshd_config
sudo service ssh restart