"""One-off: authorize this machine's public key on the deploy host, then never use the password again."""
import os
import pathlib
import sys

import paramiko

HOST = "10.215.35.10"
USER = "hzh2admin"
PUB = pathlib.Path(os.path.expanduser("~/.ssh/corp.pub")).read_text(encoding="utf-8").strip()

client = paramiko.SSHClient()
client.load_system_host_keys()
client.set_missing_host_key_policy(paramiko.RejectPolicy())
client.connect(HOST, username=USER, password=os.environ["EEA_DEPLOY_PW"], look_for_keys=False, allow_agent=False, timeout=15)

cmd = (
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && "
    f"grep -qxF '{PUB}' ~/.ssh/authorized_keys || echo \"{PUB}\" >> ~/.ssh/authorized_keys; "
    "chmod 600 ~/.ssh/authorized_keys; "
    "echo KEY_COUNT=$(grep -c '' ~/.ssh/authorized_keys)"
)
stdin, stdout, stderr = client.exec_command(cmd, timeout=20)
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
print("out:", out)
print("err:", err)
client.close()
sys.exit(0 if "KEY_COUNT" in out else 1)
