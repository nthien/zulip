#!/usr/bin/python
import sys
import os
import simplejson

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))
import zulip

zulip_client = zulip.Client(site="http://localhost:9991", client="ZulipGithubPayloadSender/0.1")

payload_dir = "zerver/fixtures/github"
for filename in os.listdir(payload_dir):
    with open(os.path.join(payload_dir, filename)) as f:
        req = simplejson.loads(f.read())
    req['api-key'] = zulip_client.api_key
    req['email'] = zulip_client.email
    zulip_client.do_api_query(req, zulip.API_VERSTRING + "external/github")
