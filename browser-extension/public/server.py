from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import re
from collections import Counter

#loading the spacy model
NLP_model = spacy.load("en_core_web_trf")

#initializing flask
app = Flask(__name__)
#enabling cors to allow requests from any url
CORS(app)

# getting keywords from the text extracted based on their category
def extract_keywords(doc):
    keywords = []
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "ORG", "EVENT", "GPE"]:
            keywords.append(ent.text)
    return keywords


@app.route("/clean_text", methods=["POST"])
def clean_text():
    try:
        data = request.get_json()
        text = data.get("text", "")
        
        # process text with spacy
        document = NLP_model(text)

        # shortening long text by keeping only 2 sentences
        sentences = list(document.sents)
        if len(sentences) > 2:
            cleaned_text = " ".join([sent.text for sent in sentences[:2]])
        else:
            cleaned_text = text

        cleaned_text = re.sub(r"[^a-zA-Z0-9\s]", "", cleaned_text)

        cleaned_document = NLP_model(cleaned_text)

        keywords = extract_keywords(cleaned_document)

        # keyword_frequency = Counter(keywords)

        # sorted_keywords_with_rankings = keyword_frequency.most_common(3)
        # sorted_keywords_only = []
        # for i in range (len(sorted_keywords_with_rankings)):
        #     sorted_keywords_only.append(sorted_keywords_with_rankings[i][0])
        
        # selected_keywords = " ".join(sorted_keywords_only)

        return jsonify({"cleaned_text": keywords})

        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


#gpt prompt for api
# Check the credibility of the following news: "{news_text}"
# Search online for any fact-checked sources.
# Determine the result based on the sources found:
# "True" if all fact-checked sources confirm the news is true.
# "False" if all fact-checked sources confirm the news is false.
# "Uncertain" if there are no fact-checked sources or conflicting information.
# Output the result in the following JSON format:
# {
#   "result": "True" or "False" or "Uncertain",
#   "sources": ["domain1.com", "domain2.com"]
# }
        
if __name__ == "__main__":
    app.run(debug=True)