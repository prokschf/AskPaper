import json
import requests

def handler(event, context):
    # Parse the event argument to extract the document content and the question.
    document_content = event['document_content']
    question = event['question']

    # Concatenate the pre-prompt, the question, and the document content with new lines in between.
    pre_prompt = "You are an excellent and detail oriented document analyst. You will receive the contents of a document and a question to answer about the document"
    input_text = f"{pre_prompt}\n{question}\n{document_content}"

    # Make a call to the GPT-4 API using the concatenated string.
    response = requests.post('https://api.openai.com/v1/engines/davinci-codex/completions', headers={'Authorization': 'Bearer YOUR_API_KEY'}, data={'prompt': input_text, 'max_tokens': 100})

    # Return the response from the GPT-4 API as a string.
    return response.text