import json
import boto3
import os
import uuid
from botocore.exceptions import NoCredentialsError
import time

def handler(event, context):
    # Log the event argument for debugging and for use in local development.
    print(json.dumps(event))

    # Retrieve the bucket name from the environment variable
    bucket_name = os.getenv('DOCUMENTBUCKET_BUCKET_ARN')

    # Parse the event argument to extract the image file
    image_file = event['body']

    # Create an S3 client
    s3 = boto3.client('s3')

    # Generate a GUID for the file name
    file_name = str(uuid.uuid4())

    # Upload the image file to the bucket
    try:
        s3.upload_fileobj(image_file, bucket_name, file_name)
    except NoCredentialsError:
        return {
            'statusCode': 400,
            'body': 'No AWS credentials found'
        }

    # Create a Textract client
    textract = boto3.client('textract')

    # Start a Textract Job
    response = textract.start_document_text_detection(
        DocumentLocation={'S3Object': {'Bucket': bucket_name, 'Name': file_name}}
    )

    # Wait for the job to complete
    while True:
        status = textract.get_document_text_detection(JobId=response['JobId'])
        if status['JobStatus'] in ['SUCCEEDED', 'FAILED']:
            break
        time.sleep(5)

    # Retrieve the result and save it as a txt file in the bucket
    if status['JobStatus'] == 'SUCCEEDED':
        text = '\n'.join([block['Text'] for block in status['Blocks'] if block['BlockType'] == 'LINE'])
        s3.put_object(Body=text, Bucket=bucket_name, Key=file_name + '.txt')

    return {
        'statusCode': 200,
        'body': 'File processed successfully'
    }