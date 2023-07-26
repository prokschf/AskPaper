import json
import boto3
import os
import base64

def handler(event, context):
    # Log the event argument for debugging and for use in local development.
    print(json.dumps(event))

    # Retrieve the bucket name from the environment variable
    bucket_name = os.environ['DOCUMENTBUCKET_BUCKET_ARN']

    # Create a boto3 client
    s3 = boto3.client('s3')

    # List all objects in the bucket
    objects = s3.list_objects(Bucket=bucket_name)['Contents']

    # Initialize an empty dictionary to store the file names and their base64 encoded content
    files = {}

    # For each object in the bucket
    for obj in objects:
        # Get the object's key
        key = obj['Key']

        # Get the object's content
        content = s3.get_object(Bucket=bucket_name, Key=key)['Body'].read()

        # Encode the content as base64
        encoded_content = base64.b64encode(content).decode()

        # Add the encoded content to the dictionary with the object's key as the dictionary key
        files[key] = encoded_content

    # Return the dictionary as a JSON structure
    return json.dumps(files)