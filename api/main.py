from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, os, uuid, hashlib, json
from utils.history import History, EmptyStackError
from utils.cache import Cache
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

MISTRAL_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

def get_tone_description(t):
    t = int(t)
    return f"with a formality level of {t}/100, where 0 is very casual/friendly/humanlike and 100 is very formal"

def make_cache_key(txt, tone):
    stuff = f"{tone}:{txt}"
    return hashlib.sha256(stuff.encode()).hexdigest()

class PairHistory:
    def __init__(self, session_id: str):
        self.history = History(session_id)

    def add_undo(self, original, transformed):
        pair = json.dumps({"original": original, "transformed": transformed})
        self.history.add_undo(pair)

    def undo(self):
        pair = self.history.undo()
        return json.loads(pair)

    def redo(self):
        pair = self.history.redo()
        return json.loads(pair)

    def reset(self):
        self.history.reset()

@app.route("/api/transform", methods=["POST"])
def change_text():
    body = request.get_json()
    txt = body.get("text", "")
    tone = body.get("tone", 50)
    sid = body.get("session_id", str(uuid.uuid4()))

    if not txt:
        return jsonify({"error": "Text is required"}), 400

    tone_description = get_tone_description(tone)
    cache = Cache(sid)
    key = make_cache_key(txt, tone)

    from_cache = cache.getCache(key)
    if from_cache:
        # Store the original and transformed as a pair
        PairHistory(sid).add_undo(txt, from_cache)
        return jsonify({"transformed": from_cache, "session_id": sid})

    prompt = f"""Rewrite the following text {tone_description}:

{txt}

IMPORTANT: Return ONLY the rewritten text. Do not include ANY explanations, introductions, notes about formality levels, or commentary. Do not mention the formality level in your response. Just return the rewritten text by itself."""

    try:
        res = requests.post(
            MISTRAL_URL,
            headers = {
                "Authorization": f"Bearer {MISTRAL_KEY}",
                "Content-Type": "application/json"
            },
            json = {
                "model": "mistral-small",
                "messages": [{"role": "user", "content": prompt}]
            }
        )

        res.raise_for_status()
        changed = res.json()["choices"][0]["message"]["content"].strip()

        if "Note:" in changed:
            changed = changed.split("Note:")[0].strip()
        if "original text" in changed.lower() or "formality level" in changed.lower():
            lines = changed.split("\n")
            filtered_lines = []
            for line in lines:
                if "original text" not in line.lower() and "formality level" not in line.lower():
                    filtered_lines.append(line)
            changed = "\n".join(filtered_lines).strip()

        cache.addCache(key, changed)
        # Store the original and transformed as a pair
        PairHistory(sid).add_undo(txt, changed)
        return jsonify({"transformed": changed, "session_id": sid})

    except requests.RequestException as err:
        return jsonify({"error": "API call failed", "details": str(err)}), 500

@app.route("/api/undo", methods=["POST"])
def go_back():
    data = request.get_json()
    sid = data.get("session_id")

    if not sid:
        return jsonify({"error": "Session ID required"}), 400

    try:
        pair = PairHistory(sid).undo()
        return jsonify({"text": pair["original"]})
    except EmptyStackError as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/redo", methods=["POST"])
def go_forward():
    data = request.get_json()
    sid = data.get("session_id")

    if not sid:
        return jsonify({"error": "Session ID required"}), 400

    try:
        pair = PairHistory(sid).redo()
        return jsonify({"text": pair["transformed"]})
    except EmptyStackError as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/reset", methods=["POST"])
def wipe_history():
    data = request.get_json()
    sid = data.get("session_id")

    if not sid:
        return jsonify({"error": "Session ID required"}), 400

    PairHistory(sid).reset()
    return jsonify({"message": "History reset"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
