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
    job_id = content.get('job_id') if content.get('job_id') else 2025
    sftp_client = get_ssh_client()
    basedir = os.path.abspath(os.path.dirname(__file__))
    file_path = os.path.join(basedir, filename)
    localFilePath = file_path
    remoteFilePath = f"/home/mlfit/{str(job_id)}/{str(filename)}"
    try:
        print(sftp_client, f'/home/mlfit/{job_id}')
        if not remote_dir_exists(sftp_client, f'/home/mlfit/{job_id}'):
            sftp_client.mkdir(f'/home/mlfit/{job_id}')
            sftp_client.put(localFilePath, remoteFilePath)
    except FileNotFoundError as err:
        return (f"File {str(err)} was not found on the local system", 400)
    sftp_client.close()
    return ('done', 204)


@app.route('/progress', methods=['GET'])
def progress():
    sftp_client = get_ssh_client()
    basedir = os.path.abspath(os.path.dirname(__file__))
    file_path = os.path.join(basedir, 'files', "test.json")
    localFilePath = file_path
    remoteFilePath = "/home/mlfit/test.json"
    try:
        file = sftp_client.get(remoteFilePath, localFilePath)

    except FileNotFoundError as err:
        print(f"File was not found on the local system")
    sftp_client.close()
    return json.load(open(localFilePath, 'r'))


@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join('files', filename))
        return (filename, 204)
    return ("", 400)


@app.route('/')
def hello_world():
    return 'Hello, World!'
