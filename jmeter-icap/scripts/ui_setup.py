import dotenv
from create_stack import Config
import subprocess
import os
import shutil

CONFIG_ENV_PATH = './config.env'


def update_config_env(setup_json):
    result = 0
    found = dotenv.find_dotenv(CONFIG_ENV_PATH)
    if not found:
        print("Please create config.env file similar to config.env.sample")
    else:
        adjust_eof_newline()
        dotenv.set_key(CONFIG_ENV_PATH, "REGION", setup_json['region'], "never")
        Config.region = setup_json['region']
        dotenv.set_key(CONFIG_ENV_PATH, "SCRIPT_BUCKET", setup_json['script_bucket'], "never")
        Config.script_bucket = setup_json['script_bucket']
        dotenv.set_key(CONFIG_ENV_PATH, "TEST_DATA_BUCKET", setup_json['test_data_bucket'], "never")
        Config.test_data_bucket = setup_json['test_data_bucket']
        dotenv.set_key(CONFIG_ENV_PATH, "TEST_DATA_ACCESS_SECRET", setup_json['test_data_access_secret'], "never")
        Config.test_data_access_secret = setup_json['test_data_access_secret']
        if setup_json['tenant_id']:
            dotenv.set_key(CONFIG_ENV_PATH, "TENANT_ID", setup_json['tenant_id'], "never")
            Config.tenant_id = setup_json['tenant_id']
        if setup_json['client_id']:
            dotenv.set_key(CONFIG_ENV_PATH, "CLIENT_ID", setup_json['client_id'], "never")
            Config.client_id = setup_json['client_id']
        if setup_json['client_secret']:
            dotenv.set_key(CONFIG_ENV_PATH, "CLIENT_SECRET", setup_json['client_secret'], "never")
            Config.client_secret = setup_json['client_secret']

    if setup_json['upload_test_data']:
        result = upload_test_data_to_s3(Config)
    return result


def retrieve_config_fields():
    params = {
        "region": "" if Config.region in ["", None] else Config.region,
        "script_bucket": "" if Config.script_bucket in ["", None] else Config.script_bucket,
        "test_data_bucket": "" if Config.test_data_bucket in ["", None] else Config.test_data_bucket,
        "test_data_access_secret": "" if Config.test_data_access_secret in ["", None] else Config.test_data_access_secret,
        "tenant_id": "" if Config.tenant_id in ["", None] else Config.tenant_id,
        "client_id": "" if Config.client_id in ["", None] else Config.client_id,
        "client_secret": "" if Config.client_secret in ["", None] else Config.client_secret
    }

    return params


def adjust_eof_newline():

    with open(CONFIG_ENV_PATH, "r+") as f:
        config_contents = f.readlines()
        if len(config_contents):
            last_line = config_contents[len(config_contents) - 1]
            if not last_line.endswith('\n'):
                f.write('\n')

        f.close()


def upload_test_data_to_s3(config):
    root_dir = '/opt/data/'
    bucket_path = "s3://{}".format(config.test_data_bucket)
    output = 1
    try:
        output = subprocess.call(['aws', 's3', 'cp', root_dir, bucket_path, '--recursive'])
    except Exception as e:
        print("Error uploading to S3: {}".format(e))

    return output


def run_project_update():
    output = subprocess.call(['sh', './update_ui.sh'])
    return output


def save_csv_file(file, target_directories, allowed_extensions):

    if not file.filename.lower().endswith(tuple(allowed_extensions)):
        return

    dotenv.set_key(CONFIG_ENV_PATH, "TEST_DATA_FILE", file.filename)
    Config.test_data_file = file.filename

    # first save file to the first directory in the list
    file_to_copy = os.path.join(target_directories[0], file.filename)
    file.save(file_to_copy)

    # copy the save file from first directory to all other directories
    for directory in target_directories[1:]:
        if os.path.exists(directory):
            shutil.copy(file_to_copy, directory)

