#!/usr/bin/env python3
"""
Embedding service dùng SentenceTransformer (gte-Qwen2 / Qwen) cho RAG.
Chạy: python embedding_service.py
Mặc định lắng nghe http://127.0.0.1:5001
Node gọi POST /encode với body {"text": "..."} hoặc {"texts": ["...", "..."]}.
"""

import os
import sys

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Thiếu thư viện. Chạy: pip install sentence-transformers", file=sys.stderr)
    sys.exit(1)

try:
    from flask import Flask, request, jsonify
except ImportError:
    print("Thiếu Flask. Chạy: pip install flask", file=sys.stderr)
    sys.exit(1)

# Model: dùng gte-Qwen2-1.5B (có thể đổi sang model nhỏ hơn, ví dụ 0.5B/0.6B nếu có)
# Hoặc Qwen3-Embedding-0.6B: tìm tên chính xác trên HuggingFace và thay vào đây.
MODEL_NAME = os.environ.get("EMBEDDING_MODEL", "Alibaba-NLP/gte-Qwen2-1.5B-instruct")

app = Flask(__name__)
model = None


def get_model():
    global model
    if model is None:
        print(f"Đang tải model {MODEL_NAME} (lần đầu có thể tải về cache)...", flush=True)
        model = SentenceTransformer(MODEL_NAME)
        print("Đã tải model xong.", flush=True)
    return model


def encode_texts(texts):
    """Biến danh sách chuỗi thành ma trận vector."""
    if not texts:
        return []
    m = get_model()
    vectors = m.encode(texts, normalize_embeddings=True)
    return vectors.tolist()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME})


@app.route("/encode", methods=["POST"])
def encode():
    try:
        data = request.get_json() or {}
        if "text" in data:
            text = (data["text"] or "").strip()
            if not text:
                return jsonify({"error": "text is empty"}), 400
            embeddings = encode_texts([text])
            return jsonify({"embedding": embeddings[0]})
        if "texts" in data:
            texts = data["texts"]
            if not isinstance(texts, list):
                return jsonify({"error": "texts must be a list"}), 400
            texts = [str(t).strip() for t in texts if t]
            if not texts:
                return jsonify({"error": "texts is empty"}), 400
            embeddings = encode_texts(texts)
            return jsonify({"embeddings": embeddings})
        return jsonify({"error": "provide 'text' or 'texts' in JSON body"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("EMBEDDING_PORT", "5001"))
    host = os.environ.get("EMBEDDING_HOST", "127.0.0.1")
    print(f"Embedding service: http://{host}:{port} (model: {MODEL_NAME})", flush=True)
    app.run(host=host, port=port, threaded=True)
