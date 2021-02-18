from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
from waitress import serve

from create_stack_dash import create_stack_from_ui, delete_stack_from_ui, Config
from database_ops import retrieve_test_results
from ui_setup import update_config_env, retrieve_config_fields, run_project_update, save_csv_file

UPLOAD_FOLDERS = ['ICAP-Direct-File-Processing', 'ICAP-Sharepoint-Site', 'REST-API']
ALLOWED_EXTENSIONS = {'csv'}
NUMBER_OF_ROWS_TO_RETRIEVE = 10

app = Flask(__name__)
app.config['UPLOAD_FOLDERS'] = UPLOAD_FOLDERS
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS


@app.route('/', methods=["POST", "GET"])
def parse_request():
    if request.method == 'POST':
        button_pressed = request.form.get('button')
        print('Request Type: {0}'.format(button_pressed))

        stack_name = request.form.get('stack')

        if button_pressed == 'generate_load':
            data = json.loads(request.form.get('form'))
            print('Data sent from UI: {0}'.format(data))
            (returned_url, stack_name) = create_stack_from_ui(data, ova=False)
            if returned_url:
                # make an entry in the database for this new test then return response to front end
                return make_response(jsonify(url=returned_url, stack_name=stack_name), 201)
            else:
                return make_response("Error", 500)

        elif button_pressed == 'stop_individual_test':
            delete_stack_from_ui(stack_name)
            return make_response(jsonify("Test {0} terminated".format(stack_name)), 201)

        elif button_pressed == 'setup_config':
            data = json.loads(request.form.get('form'))
            print('Setup Data sent from UI: {0}'.format(data))
            result = update_config_env(data)

            if 'file' in request.files:
                file = request.files['file']
                save_csv_file(file, UPLOAD_FOLDERS, ALLOWED_EXTENSIONS)

            if result == 0:
                return make_response(jsonify(response="OK"), 200)
            else:
                return make_response(jsonify(response="UPLOADFAILED"), 400)

        elif button_pressed == 'update':
            result = run_project_update()
            return make_response(jsonify(response="OK"), 200)

    if request.method == 'GET':
        if request.args['request_type'] == 'test_results':
            test_results = retrieve_test_results(NUMBER_OF_ROWS_TO_RETRIEVE)
            grafana_url = Config.grafana_url
            return make_response(jsonify(test_results, grafana_url), 201)
        elif request.args['request_type'] == 'config_fields':
            config_fields = retrieve_config_fields()
            return make_response(jsonify(config_fields), 201)


CORS(app)
serve(app, host='0.0.0.0', port=5000)
