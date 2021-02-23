from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
from waitress import serve

from create_stack import Config
from database_ops import retrieve_test_results
from ui_setup import update_config_env, retrieve_config_fields, run_project_update, save_csv_file
import run_local_test
from waitress import serve
from ui_tasks import terminate_java_processes

UPLOAD_FOLDERS = ['/opt/jmeter/apache-jmeter-5.3/bin/']
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

        if button_pressed == 'generate_load':
            data = json.loads(request.form.get('form'))
            print('Data sent from UI: {0}'.format(data))
            returned_url = run_local_test.main(data)
            if returned_url:
                return make_response(jsonify(url=returned_url, stack_name=Config.stack_name), 201)
            else:
                return make_response("Error", 500)

        elif button_pressed == 'stop_tests':
            terminate_java_processes()
            return make_response(jsonify("Tests terminated"), 201)

        elif button_pressed == 'setup_config':
            data = json.loads(request.form.get('form'))
            print('Setup Data sent from UI: {0}'.format(data))
            result = update_config_env(data)

            if 'file' in request.files:
                file = request.files['file']
                save_csv_file(file, UPLOAD_FOLDERS, ALLOWED_EXTENSIONS, ova=True)

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
