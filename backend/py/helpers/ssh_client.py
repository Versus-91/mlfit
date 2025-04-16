

import paramiko

from constants import HPC_HOST, HPC_PASSWORD, HPC_USER


def get_ssh_client():
    SSH_Client = paramiko.SSHClient()
    SSH_Client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    SSH_Client.connect(hostname=HPC_HOST, port=22, username=HPC_USER,
                       password=HPC_PASSWORD, look_for_keys=False
                       )
    return SSH_Client.open_sftp()
