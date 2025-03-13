from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import json

#setting up api key
client = openai.OpenAI(api_key="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")

def analyze_sentiment(text):
    try:
        response = client.chat.completions.create(
            model = "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You analyze text sentiment. Respond strictly in valid JSON format."},
                {"role": "user", "content": f"""
                    Analyze the following text and return a JSON object with:
                    - "label" (one of: "Sensational", "Emotional", "Neutral")
                    - "explanations" (an array of at most 2 short phrases explaining why)

                    Text: {text}

                    Strictly return a valid JSON object with keys "label" and "explanations".
                """}],
            response_format={"type": "json_object"},
            max_tokens = 50
        )

        result = json.loads(response.choices[0].message.content.strip())

        return result
    
    except Exception as e:
        print("Error", e)
        return "Error has occurred"
    
#initializing flask
app = Flask(__name__)
#enabling cors to allow requests from any url
CORS(app)

@app.route("/clean_text", methods=["POST"])
def clean_text():
    try:
        data = request.get_json()
        text = data.get("text", "")

        sentiment_analysis = analyze_sentiment(text)

        label = sentiment_analysis.get("label", "Unknown")
        explanations = (sentiment_analysis.get("explanations", []))
        return { 
            "label":label,
            "explanations": "1. " + explanations[0] + "\n" + "2. " + explanations[1]
        }

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)