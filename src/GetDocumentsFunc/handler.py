import json
import boto3
import os
import base64

def handler(event, context):
    # Log the event argument for debugging and for use in local development.
    print(json.dumps(event))

    # Create a boto3 client for S3
    s3 = boto3.client('s3')

    # Retrieve the bucket name from the environment variable
    bucket_name = os.environ['DOCUMENTBUCKET_BUCKET_ARN']

    try:
        # List all files in the bucket
        files = s3.list_objects(Bucket=bucket_name)['Contents']

        # Group files by their names without the file extension
        grouped_files = {}
        for file in files:
            file_name = file['Key']
            base_name = os.path.splitext(file_name)[0]
            if base_name not in grouped_files:
                grouped_files[base_name] = []
            grouped_files[base_name].append(file_name)

        # For each group, read the image file and convert it to a base64 string, and read the text file as plain text
        result = {}
        for base_name, file_names in grouped_files.items():
            for file_name in file_names:
                if file_name.endswith('.txt'):
                    obj = s3.get_object(Bucket=bucket_name, Key=file_name)
                    text = obj['Body'].read().decode('utf-8')
                    result[base_name] = {'text': text}
                else:
                    obj = s3.get_object(Bucket=bucket_name, Key=file_name)
                    image = base64.b64encode(obj['Body'].read()).decode('utf-8')
                    if base_name in result:
                        result[base_name]['image'] = image
                    else:
                        result[base_name] = {'image': image}

        # Return the JSON structure
        return json.dumps(result)

    except Exception as e:
        print(e)
        return {'error': str(e)}