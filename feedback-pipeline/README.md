# Feedback Processing Pipeline

A Node.js pipeline for async feedback processing with AI sentiment analysis.

## Architecture

```
[Client] → POST /feedback → [API Server] → [Redis/BullMQ Queue]
                                                    ↓
[Prometheus] ← /metrics ← [Worker] → [AI API] → [MongoDB]
```

## Features

- **Async Processing**: Jobs queued via BullMQ (Redis-backed)
- **AI Sentiment**: Calls Hugging Face API (or compatible) for sentiment analysis
- **Idempotent Storage**: MongoDB with jobId as unique key
- **Retries**: Exponential backoff (1s, 2s, 4s)
- **Metrics**: Prometheus-compatible `/metrics` endpoint
- **Logging**: Structured JSON (pino) for Logstash/ELK

## Quick Start

### 1. Prerequisites

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start MongoDB
docker run -d -p 27017:27017 mongo:latest
```

### 2. Install & Configure

```bash
cd feedback-pipeline
npm install

# Copy and edit .env
cp .env.example .env
# Edit .env with your Hugging Face API key
```

### 3. Run

```bash
# Terminal 1: API Server (port 3005)
npm run start:api

# Terminal 2: Worker (metrics on port 3006)
npm run start:worker

# Or run both:
npm run dev
```

### 4. Test

```bash
# Submit feedback
curl -X POST http://localhost:3005/feedback \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "text": "I love this product! Great support team."}'

# Response: {"jobId": "uuid...", "status": "queued"}

# Check job status
curl http://localhost:3005/feedback/{jobId}

# Health check
curl http://localhost:3005/health

# Prometheus metrics
curl http://localhost:3005/metrics   # API metrics
curl http://localhost:3006/metrics   # Worker metrics
```

## Configuration (.env)

| Variable             | Default                   | Description                |
| -------------------- | ------------------------- | -------------------------- |
| `REDIS_HOST`         | localhost                 | Redis host                 |
| `REDIS_PORT`         | 6379                      | Redis port                 |
| `MONGO_URI`          | mongodb://localhost:27017 | MongoDB connection         |
| `MONGO_DB`           | feedback_pipeline         | Database name              |
| `AI_API_URL`         | -                         | Hugging Face inference URL |
| `AI_API_KEY`         | -                         | HF API key                 |
| `WORKER_CONCURRENCY` | 5                         | Parallel job processing    |
| `JOB_TIMEOUT_MS`     | 30000                     | AI API timeout             |
| `MAX_RETRIES`        | 3                         | Retry attempts             |
| `API_PORT`           | 3005                      | API server port            |

## Key Design Decisions

### Idempotency

- `jobId` used as MongoDB `_id` with upsert
- Prevents duplicate processing if job retried or resubmitted

### Retry with Exponential Backoff

- BullMQ handles retries automatically
- Backoff: `2^attempt * 1000ms` (1s, 2s, 4s...)
- Prevents overwhelming failed services

### Normalized AI Response

```javascript
{
  sentiment: 'positive' | 'negative' | 'neutral',
  score: 0.95,        // Confidence 0-1
  intents: ['support_request', 'positive_feedback'],
  raw: {...}          // Original API response
}
```

### Metrics (prom-client)

- `feedback_jobs_processed_total{status}` - Success/failure count
- `feedback_job_duration_seconds` - Processing time histogram
- `feedback_sentiment_total{sentiment}` - Sentiment distribution
- `http_requests_total` - API request count
- Default Node.js metrics (memory, CPU, GC)

## MongoDB Schema

```javascript
{
  jobId: "uuid",           // Unique, indexed
  userId: "user123",
  text: "Original feedback text",
  metadata: {...},
  result: {
    sentiment: "positive",
    score: 0.95,
    intents: ["positive_feedback"],
    raw: {...}
  },
  processedAt: ISODate()
}
```

## Production Considerations

1. **Scale workers**: Run multiple `worker.js` instances
2. **Redis cluster**: Use Redis Cluster for HA
3. **MongoDB replica set**: For durability
4. **Rate limiting**: Add to API if public-facing
5. **Auth**: Add JWT/API key authentication
6. **TLS**: Enable HTTPS and secure Redis/Mongo connections
