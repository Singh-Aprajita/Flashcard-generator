import json
import ollama
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/generate_flashcards', methods=['POST'])
def generate_flashcards():
    try:
        data = request.get_json()
        notes = data.get('notes', '').strip()

        if not notes:
            return jsonify({'error': 'No notes provided'}), 400

        print(f"[Input Notes]\n{notes}\n")

        # Strong prompt to enforce JSON output
        system_prompt = (
            "You are a helpful assistant that creates flashcards from notes. "
            "Respond ONLY with a valid JSON array like this: "
            '[{"front": "Question?", "back": "Answer"}]. '
            "Do not include any extra text or formatting."
        )

        user_prompt = f"Generate flashcards from the following:\n\n{notes}"

        response = ollama.generate(
            model='phi3:mini',
            prompt=user_prompt,
            system=system_prompt,
            stream=False
        )

        generated_text = response['response'].strip()
        print(f"[Raw Model Output]\n{generated_text}\n")

        # Attempt to extract JSON array from model output
        match = re.search(r'\[\s*{.*?}\s*\]', generated_text, re.DOTALL)
        if not match:
            return jsonify({'error': 'No JSON array found in model response.'}), 500

        json_string = match.group(0).strip()

        # --- Clean common formatting mistakes ---
        json_string = json_string.replace("‘", '"').replace("’", '"')
        json_string = json_string.replace("“", '"').replace("”", '"')
        json_string = json_string.replace("'", '"')

        # Remove trailing commas before closing brackets
        json_string = re.sub(r',\s*([}\]])', r'\1', json_string)

        # Optional: compact formatting
        json_string = re.sub(r'\s+', ' ', json_string).strip()

        # Try to load the sanitized JSON string
        try:
            flashcards = json.loads(json_string)
            if not isinstance(flashcards, list):
                raise ValueError("Response is not a JSON list.")
        except Exception as e:
            return jsonify({'error': f'Failed to parse JSON: {str(e)}', 'raw': json_string}), 500

        return jsonify({'flashcards': flashcards})

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
