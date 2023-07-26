import json
import os
import boto3
import base64

def handler(event, context):
    # Log the event argument for debugging and for use in local development.
    print(json.dumps(event))

    bucket_name = os.environ["DOCUMENTBUCKET_BUCKET_ARN"]
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    files = [obj.key for obj in bucket.objects.all() if '.' not in obj.key]

    documents = {}
    for file in files:
        obj = s3.Object(bucket_name, file)
        content = obj.get()['Body'].read()
        base64_content = base64.b64encode(content).decode('utf-8')
        documents[file] = base64_content

    return json.dumps(documents)