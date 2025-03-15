from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import json
import joblib
import re
import string

# Load the saved model and vectorizer
clickbait_model = joblib.load("public/clickbait_model.pkl")
tfidf_vectorizer = joblib.load("public/tfidf_vectorizer.pkl")

# Function to clean headlines (same as before)
def preprocess_text(text):
    text = text.lower()  # Lowercase
    text = re.sub(f"[{string.punctuation}]", "", text)  # Remove punctuation
    text = re.sub(r'\s+', ' ', text).strip()  # Remove extra spaces
    return text

#setting up api key
client = openai.OpenAI(api_key="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")

def analyse_sentiment(text, retries = 2):
    try:
        response = client.chat.completions.create(
            model = "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You analyze text sentiment. Respond strictly in valid JSON format."},
                {"role": "user", "content": f"""
                    Analyze the following text and return a JSON object with:
                    - "label" (one of: "Sensational", "Emotional", "Neutral", "Sarcastic / Satirical", "Persuasive", "Propaganda")
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
           return analyse_sentiment(text, retries -1)
        else:
            print("Error: Gpt returned invalid json multiple times.")
            return{"label": "Error", "explanations":["Unexpected Issue happened"]}
 
#initializing flask
app = Flask(__name__)
#enabling cors to allow requests from any url
CORS(app)

@app.route("/analyse_sentiment_of_text", methods=["POST"])
def analyse_sentiment_of_text():
    try:
        data = request.get_json()
        text = data.get("text", "")

        sentiment_analysis = analyse_sentiment(text)

        label = sentiment_analysis.get("label")
        explanations = (sentiment_analysis.get("explanations"))
        
        if (label != "Error"):
            return {
                "label":label,
                "explanations": f"1. {explanations[0]} <br> 2. {explanations[1]}"
            }
        else:
            return {
                "label": "Unexpected Error",
                "explanations": "Sentiment couldn't be processed!"
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

        # Convert text to TF-IDF features
        transformed_text = tfidf_vectorizer.transform([cleaned_headline])

        # Predict clickbait
        prediction = clickbait_model.predict(transformed_text)[0]

        return jsonify({"clickbait": bool(prediction)})

    except Exception as e:
        return jsonify({"error": str(e)}), 400




if __name__ == "__main__":
    app.run(debug=True)