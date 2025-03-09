from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy

#loading the spacy model
NLP_model = spacy.load("en_core_web_sm")

#initializing flask
app = Flask(__name__)
#enabling cors to allow requests from any url
CORS(app)

@app.route("/clean_text", methods=["POST"])
def clean_text():
    try:
        data = request.get_json()
        text = data.get("text", "")

        # process text with spacy
        doc = NLP_model(text)
        cleaned_text = " ".join([token.text for token in doc if not token.is_stop and not token.is_punct])

        return jsonify({"cleaned_text": cleaned_text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)