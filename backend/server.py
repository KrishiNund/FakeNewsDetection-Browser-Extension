from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import json
import joblib
import re
import string
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# loading the variables from the .env file
load_dotenv()

mongodb_uri = os.getenv("MONGODB_URI")
gpt_api_key = os.getenv("GPT_API_KEY")
perplexity_api_key = os.getenv("PERPLEXITY_API_KEY")

# connecting to MongoDB
client = MongoClient(mongodb_uri)
db = client["Fake_News_Detection"]
reports_collection = db["Reports"]

# loading the saved model and vectorizer
clickbait_model = joblib.load("backend/clickbait_model300d.pkl")

# loading the saved fake news detection model
fake_news_model = joblib.load("backend/fake_news_model300d.pkl")

# Load GloVe embeddings into a dictionary
def load_glove_embeddings(glove_file):
    embeddings_index = {}
    with open(glove_file, 'r', encoding='utf-8') as f:
        for line in f:
            values = line.split()
            word = values[0]  # First word is the key
            vector = np.asarray(values[1:], dtype='float32')  # The rest are the embedding values
            embeddings_index[word] = vector
    return embeddings_index

# loading GloVe
glove_path = "backend/glove.6B.300d.txt" 
word_to_vec_map = load_glove_embeddings(glove_path)

def sentence_to_glove_vector(sentence, word_to_vec_map):
    words = sentence.split()
    word_vectors = [word_to_vec_map[word] for word in words if word in word_to_vec_map]
    
    if len(word_vectors) == 0:
        return np.zeros((300,))  # If no words are found, return a zero vector
    
    return np.mean(word_vectors, axis=0)  # Average word vectors

# Function to clean headlines (same as before)
def preprocess_text(text):
    text = text.lower()  # Lowercase
    text = re.sub(f"[{string.punctuation}]", "", text)  # Remove punctuation
    text = re.sub(r'\s+', ' ', text).strip()  # Remove extra spaces
    return text


#setting up api key
client = openai.OpenAI(api_key=gpt_api_key)

def analyse_language(text, retries = 2):
    try:
        response = client.chat.completions.create(
            model = "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You analyze the language used in text. Respond strictly in valid JSON format."},
                {"role": "user", "content": f"""
                    Analyze the following text and return a JSON object with:
                    - "label" (one of: "Sensational", "Neutral")
                    - "explanations" (an array of at most 2 very short phrases explaining why)

                    Text: {text}

                    Strictly return a valid JSON object with keys "label" and "explanations".
                """}],
            response_format={"type": "json_object"},
            max_tokens = 50
        )

        result = json.loads(response.choices[0].message.content)

        return result
    
    except Exception as e:
        if retries > 0:
           print("Invalid JSON format, retrying...")
           return analyse_language(text, retries -1)
        else:
            print("Error: Gpt returned invalid json multiple times.")
            return{"label": "Error", "explanations":["Unexpected Issue happened"]}


# using perplexity api to fact check
clientPerplexity = openai.OpenAI(api_key=perplexity_api_key, base_url="https://api.perplexity.ai")
def cross_verify_with_perplexity(text):
    try:
        messages = [
            {
                "role": "system",
                "content": (
                    """
                        You are an AI that verifies claims by checking multiple online news sources.
                        Your job is to search for reliable and reputable sources that report similar claims.

                        - If at least one reputable source reports the same claim, return: "Likely True".
                        - If at least one reputable source contradicts the claim, return: "Likely False".
                        - If there is no strong evidence supporting or contradicting the claim, return: "Unverified".

                        Strictly provide your answer as just one of these three words only: "Likely True", "Likely False", or "Unverified". No extra text.
                    """
                ),
            },
            {
                "role": "user",
                "content": f"Fact-check this claim: {text}",
            },
        ]
        response = clientPerplexity.chat.completions.create(
            model="sonar",
            messages=messages,
            temperature= 0,
            max_tokens = 3,
            web_search_options= {"search_context_size": "low"}
        )
        return response.choices[0].message.content.strip()  
    except Exception as e:
        return("Error is ", e)



#initializing flask
app = Flask(__name__)
#enabling cors to allow requests from any url
CORS(app)

@app.route("/report", methods=["POST"])
def report():
    data = request.json
    if not data or "headline" not in data or "text" not in data or "prediction" not in data:
        return jsonify({"message": "Invalid data"}), 400
    
    report_details = {
        "headline": data["headline"],
        "text": data["text"],
        "source": data["source"],
        "prediction_made": data["prediction"],
        "actual_prediction":data["actual_prediction"],
    }

    reports_collection.insert_one(report_details)
    return jsonify({"message": "Report successful!"}), 201


@app.route("/analyse_language_of_text", methods=["POST"])
def analyse_language_of_text():
    try:
        data = request.get_json()
        text = data.get("text", "")

        language_analysis = analyse_language(text)

        label = language_analysis.get("label")
        explanations = (language_analysis.get("explanations"))
        
        if (label != "Error"):
            return {
                "label":label,
                "explanations": f"1. {explanations[0]} <br> 2. {explanations[1]}"
            }
        else:
            return {
                "label": "Unexpected Error",
                "explanations": "Language Analysis couldn't be performed!"
            }

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/detect_clickbait", methods=["POST"])
def detect_clickbait():
    try:
        data = request.get_json()
        headline = data.get("headline", "")

        # Preprocess headline
        cleaned_headline = preprocess_text(headline)
    
        glove_vector = sentence_to_glove_vector(cleaned_headline, word_to_vec_map)

        # Predict clickbait
        prediction = clickbait_model.predict([glove_vector])[0]

        return jsonify({"clickbait": bool(prediction)})

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/detect_fake_news", methods=["POST"])
def detect_fake_news():
    try:
        data = request.get_json()
        headline = data.get("headline", "")
        text = data.get("text", "")

        #fact check first
        cross_verification = cross_verify_with_perplexity(text)
        print(cross_verification)

        if (cross_verification == "Likely True"):
            print("Preplexity prediction true!")
            return jsonify({"label": "Likely True"})
        
        elif (cross_verification == "Likely False"):
            print("Perplexity prediction false")
            return jsonify({"label": "Likely False"})
        
        else:
            cleaned_headline = preprocess_text(headline)
            cleaned_text = preprocess_text(text)

            combined_text = cleaned_headline + ' ' + cleaned_text;

            glove_vector = sentence_to_glove_vector(combined_text, word_to_vec_map)

            prediction = fake_news_model.predict([glove_vector])[0]

            print(prediction)
            if (prediction == 1):
                return jsonify({"label": "Likely True"})
            else:
                return jsonify({"label": "Likely False"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    

if __name__ == "__main__":
    app.run(debug=True)