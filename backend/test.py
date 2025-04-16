from py.helpers.ssh_client import get_ssh_client


sftp_client = get_ssh_client()
stdin, stdout, stderr = sftp_client.exec_command('cd /hol -l /home')
output = stdout.read().decode()
errors = stderr.read().decode()
print(output)
print(errors)
