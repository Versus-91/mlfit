import os
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from missforest.missforest import MissForest
import json
import pandas as pd
import paramiko

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route('/missforest', endpoint='imputation', methods=['POST'])
def hello_world():
    content = request.get_json()
    clf = RandomForestClassifier(n_jobs=-1)
    rgr = RandomForestRegressor(n_jobs=-1)
    mf = MissForest(clf, rgr)
    df = pd.io.json.json_normalize(content.get('data'))

    print(df.head)
    df_imputed = mf.fit_transform(
        df, categorical=content.get('categoricalFeatures'))
    return json.loads(df_imputed.to_json(orient='records'))


@app.route('/run', methods=['GET'])
def connect():
    SSH_Client = paramiko.SSHClient()
    SSH_Client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    SSH_Client.connect(hostname="login2.barnard.hpc.tu-dresden.de", port=22, username="mlfit",
                       password="Fit_ML_Tool_2", look_for_keys=False
                       )
    sftp_client = SSH_Client.open_sftp()
    basedir = os.path.abspath(os.path.dirname(__file__))
    file_path = os.path.join(basedir, 'housing.csv')
    localFilePath = file_path
    remoteFilePath = "/home/mlfit/housing.csv"
    try:
        sftp_client.put(localFilePath, remoteFilePath)
    except FileNotFoundError as err:
        print(err)
        print(f"File {str(err)} was not found on the local system")
    sftp_client.close()
    return os.getcwd()


@app.route('/')
def hello_world():
    return 'Hello, World!'
