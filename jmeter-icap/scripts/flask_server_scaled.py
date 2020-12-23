from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import run_local_test
from waitress import serve
from create_stack_dash import create_stack_from_ui, delete_stack_from_ui

UPLOAD_FOLDER = './'
ALLOWED_EXTENSIONS = {'csv'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/', methods=["POST"])
def parse_request():
    button_pressed = request.form.get('button')
    print('Request Type: {0}'.format(button_pressed))

    stack_name = request.form.get('stack')

    if button_pressed == 'generate_load':
        data = json.loads(request.form.get('form'))
        print('Data sent from UI: {0}'.format(data))
        (returned_url, stack_name) = create_stack_from_ui(data, ova=False)
        if returned_url:
            return make_response(jsonify(url=returned_url, stack_name=stack_name), 201)
        else:
            return make_response("Error", 500)
    elif button_pressed == 'stop_individual_test':
        delete_stack_from_ui(stack_name)
        return make_response(jsonify("Test {0} terminated".format(stack_name)), 201)


CORS(app)
serve(app, host='0.0.0.0', port=5000)
