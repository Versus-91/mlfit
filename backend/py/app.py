from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from missforest.missforest import MissForest
import json
import pandas as pd

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


@app.route('/')
def hello_world():
    return 'Hello, World!'
