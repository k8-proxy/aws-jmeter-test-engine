import dotenv

CONFIG_ENV_PATH = './config.env'


def update_config_env(setup_json):

    found = dotenv.find_dotenv(CONFIG_ENV_PATH)
    if not found:
        print("Please create config.env file similar to config.env.sample")
    else:
        dotenv.set_key(CONFIG_ENV_PATH, "SCRIPT_BUCKET", setup_json['script_bucket'], "never")
        dotenv.set_key(CONFIG_ENV_PATH, "TEST_DATA_BUCKET", setup_json['test_data_bucket'], "never")
        dotenv.set_key(CONFIG_ENV_PATH, "TEST_DATA_ACCESS_SECRET", setup_json['test_data_access_secret'], "never")

        if setup_json['tenant_id']:
            dotenv.set_key(CONFIG_ENV_PATH, "TENANT_ID", setup_json['tenant_id'], "never")
        if setup_json['client_id']:
            dotenv.set_key(CONFIG_ENV_PATH, "CLIENT_ID", setup_json['client_id'], "never")
        if setup_json['client_secret']:
            dotenv.set_key(CONFIG_ENV_PATH, "CLIENT_SECRET", setup_json['client_secret'], "never")


def retrieve_config_fields():
    from create_stack import Config
    params = {
        "script_bucket": "" if Config.script_bucket in ["", None] else Config.script_bucket,
        "test_data_bucket": "" if Config.test_data_bucket in ["", None] else Config.test_data_bucket,
        "test_data_access_secret": "" if Config.test_data_access_secret in ["", None] else Config.test_data_access_secret,
        "tenant_id": "" if Config.tenant_id in ["", None] else Config.tenant_id,
        "client_id": "" if Config.client_id in ["", None] else Config.client_id,
        "client_secret": "" if Config.client_secret in ["", None] else Config.client_secret
    }

    return params


if __name__ == "__main__":
    pass
