from flask import Flask
from flask import request

app = Flask(__name__)


@app.route('/missforest', endpoint='imputation', methods=['POST'])
def hello_world():
    content = request.json
    print(content)
    return 'Hello, World!'


@app.route('/')
def hello_world():
    return 'Hello, World!'
