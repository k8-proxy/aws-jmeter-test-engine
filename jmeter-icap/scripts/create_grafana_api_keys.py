# importing the requests library
import requests
import re
# defining the api-endpoint
API_ENDPOINT = "http://localhost:3000/api/auth/keys"
username="admin"
password="admin"


key_data = {
  "name":"api-key-test-1911",
  "role":"Admin",
  "secondsToLive": 86400
}

headers={'content-type': 'application/json'}

# sending post request and saving response as response object
r = requests.post(url=API_ENDPOINT, data=key_data,auth=(username, password))

# extracting response text

print("Grafana API Key :%s" % r.text)

print("Grafana API Key :%s" % r.json().get("key"))

filename = "config.env"

key="GRAFANA_KEY="+r.json().get("key")

with open(filename, 'r+') as f:
    text = f.read()
    text = re.sub('GRAFANA_KEY=', key, text)
    f.seek(0)
    f.write(text)
    f.truncate()
    f.close()

