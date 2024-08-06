from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route('/missforest', endpoint='imputation', methods=['POST'])
def hello_world():
    content = request.json
    print(jsonify(content))
    return jsonify(content)


@app.route('/')
def hello_world():
    return 'Hello, World!'
