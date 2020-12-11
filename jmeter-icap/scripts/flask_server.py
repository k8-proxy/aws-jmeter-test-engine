from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import run_local_test
from waitress import serve
from stop_tests import terminate_java_processes

UPLOAD_FOLDER = './'
ALLOWED_EXTENSIONS = {'csv'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
@app.route('/', methods=["POST"])
def parse_request():
    button_pressed = request.form.get('button')
    print('Request Type: {0}'.format(button_pressed))

    if button_pressed == 'generate_load':
        data = json.loads(request.form.get('form'))
        print('Data sent from UI: {0}'.format(data))
        returned_url = run_local_test.main(data)
        if returned_url:
            return make_response(jsonify(returned_url), 201)
        else:
            return make_response("Error", 500)
    elif button_pressed == 'stop_tests':
        terminate_java_processes()
        return make_response(jsonify("Tests terminated"), 201)

CORS(app)
serve(app, host='0.0.0.0', port=5000)
