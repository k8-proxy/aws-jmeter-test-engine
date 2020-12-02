from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
from create_stack_dash import run_using_json
import run_local_test

UPLOAD_FOLDER = './'
ALLOWED_EXTENSIONS = {'csv'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
@app.route('/', methods=["POST"])
def parse_request():
    data = json.loads(request.form.get('form'))
    print(data)

    # if 'file' not in request.files:
    #     return redirect(request.url)
    # file = request.files['file']
    # if user does not select file, browser also
    # submit an empty part without filename
    # if file.filename == '':
    #     return redirect(request.url)
    # if file:
    #     filename = secure_filename(file.filename)
    #     file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))


    returned_url = run_local_test.main(data)
    if returned_url:
        return make_response(jsonify(returned_url), 201)

CORS(app)
app.run()