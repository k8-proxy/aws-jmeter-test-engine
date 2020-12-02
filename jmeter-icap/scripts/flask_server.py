from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import run_local_test
from waitress import serve

UPLOAD_FOLDER = './'
ALLOWED_EXTENSIONS = {'csv'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
@app.route('/', methods=["POST"])
def parse_request():
    data = json.loads(request.form.get('form'))
    print(data)

    returned_url = run_local_test.main(data)
    if returned_url:
        return make_response(jsonify(returned_url), 201)

CORS(app)
serve(app, host='0.0.0.0', port=5000)
