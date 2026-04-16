# Embedding service (Qwen / gte-Qwen2)

Dùng **SentenceTransformer** để biến văn bản (tiêu đề sách, câu hỏi) thành vector phục vụ RAG.

## Cài đặt

```bash
pip install -r requirements-embedding.txt
```

## Chạy service

```bash
python embedding_service.py
```

Mặc định chạy tại `http://127.0.0.1:5001`. Đổi port/host bằng biến môi trường:

- `EMBEDDING_PORT=5001`
- `EMBEDDING_HOST=127.0.0.1`
- `EMBEDDING_MODEL=Alibaba-NLP/gte-Qwen2-1.5B-instruct` (model mặc định)

## Dùng model khác (ví dụ Qwen3-Embedding-0.6B)

Nếu bạn muốn dùng model nhỏ hơn (0.6B), tìm tên chính xác trên HuggingFace rồi set:

```bash
export EMBEDDING_MODEL="Tên-model-tren-HuggingFace"
python embedding_service.py
```

Ví dụ với gte-Qwen2 nhỏ hơn (nếu có): `Alibaba-NLP/gte-Qwen2-0.5B-instruct`.

## API

- **GET /health** — Kiểm tra service và tên model.
- **POST /encode** — Body JSON:
  - `{"text": "một đoạn văn"}` → trả về `{"embedding": [ ... ]}`
  - `{"texts": ["đoạn 1", "đoạn 2"]}` → trả về `{"embeddings": [[...], [...]]}`

## Cấu hình Node

Trong `.env` của project (thư mục gốc):

```env
EMBEDDING_SERVICE_URL=http://127.0.0.1:5001
```

Sau đó chạy tạo embedding cho sách (một lần hoặc khi thêm sách mới):

```bash
npm run generate:embeddings
```

RAG (chat AI) sẽ dùng service này để embed câu hỏi và tìm sách tương đồng theo vector.
