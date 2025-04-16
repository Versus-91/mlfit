import io
import os
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from missforest.missforest import MissForest
import json
import pandas as pd
import paramiko
from werkzeug.utils import secure_filename

from helpers.ssh_client import get_ssh_client
from helpers.commnad_write import CommandWriter

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
ALLOWED_EXTENSIONS = {'csv'}
app.config['MAX_CONTENT_LENGTH'] = 128 * 1000 * 1000


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def remote_dir_exists(sftp, path):
    try:
        s = sftp.stat(path)
        return True
    except FileNotFoundError:
        return False


@app.route('/missforest', endpoint='imputation', methods=['POST'])
def hello_world():
    content = request.get_json()
    clf = RandomForestClassifier(n_jobs=-1)
    rgr = RandomForestRegressor(n_jobs=-1)
    mf = MissForest(clf, rgr)
    df = pd.io.json.json_normalize(content.get('data'))
    df_imputed = mf.fit_transform(
        df, categorical=content.get('categoricalFeatures'))
    return json.loads(df_imputed.to_json(orient='records'))


@app.route('/run', methods=['GET'])
def execute():
    content = request.args
    filename = content.get('file_name') if content.get(
        'file_name') else "housing.csv"
    method_name = content.get('method_name')
    seed = content.get('seed')
    target_feature = content.get('target')
    job_id = content.get('job_id') if content.get('job_id') else 2025
    ssh = get_ssh_client()
    sftp_client = ssh.open_sftp()
    basedir = os.path.abspath(os.path.dirname(__file__))
    file_path = os.path.join(basedir, "files", filename)
    localFilePath = file_path
    remoteFilePath = f"/home/mlfit/{str(job_id)}/{str(filename)}"
    try:
        if not remote_dir_exists(sftp_client, f'/home/mlfit/{job_id}'):
            writer = CommandWriter()
            k = writer.get_command(
                {"explain": True, "target": target_feature, "seed": seed})
            python_file_name = f'{job_id}.py'
            with open(python_file_name, 'w') as f:
                f.write(k)
            sftp_client.mkdir(f'/home/mlfit/{job_id}')
            sftp_client.put(localFilePath, remoteFilePath)
            file_path = os.path.join(basedir, python_file_name)
            remoteFilePath = f"/home/mlfit/{str(job_id)}/{python_file_name}"
            sftp_client.put(file_path, remoteFilePath)
            stdin, stdout, stderr = ssh.exec_command(
                f'cd /home/mlfit/{str(job_id)} && source /data/horse/ws/mlfit-python_virtual_environment/bin/activate && sbatch --cpus-per-task=4 --mem=4G --time=01:00:00 --wrap="python3 {str(job_id)}.py"')
            output = stdout.read().decode()
            errors = stderr.read().decode()
            print(output)
            print(errors)
            os.remove(file_path)

    except FileNotFoundError as err:
        return (f"File {str(err)} was not found on the local system", 400)
    ssh.close()
    return ('done', 204)


@app.route('/progress', methods=['GET'])
def progress():
    ssh = get_ssh_client()
    sftp_client = ssh.open_sftp()
    content = request.args
    job_id = content.get('job_id')
    remoteFilePath = f"/home/mlfit/{str(job_id)}/res.json"
    try:
        if not remote_dir_exists(sftp_client, remoteFilePath):
            return ('ongoing', 200)
        else:
            basedir = os.path.abspath(os.path.dirname(__file__))
            local_file_path = os.path.join(basedir, "files", f"{job_id}.json")
            sftp_client.get(remoteFilePath, local_file_path)
            ssh.close()
            with open(local_file_path, 'r') as f:
                return json.load(f)
    except FileNotFoundError as err:
        return ("File was not found on the local system", 400)


@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join('files', filename))
        print(filename)
        return (filename, 200)
    return ("", 400)


@app.route('/')
def hello_world():
    return 'Hello, World!'
