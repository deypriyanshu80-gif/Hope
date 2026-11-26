# Hope

A distributed, event-driven disaster ingestion and spatial triage command center built to absorb high-throughput emergency message bursts, extract structured GeoJSON via background LLM workers, deduplicate nearby incidents atomically, and stream real-time tactical updates to a live map.

---

## System Architecture

<img width="1173" height="951" alt="Disaster Triage   Logistics Architecture" src="https://github.com/user-attachments/assets/44926d7a-98e2-49ea-8dd7-c0718d385215" />


### End-to-End Data Pipeline
1. **Chaos Simulator (`apps/chaos-simulator`)**: Blasts `500+ requests/sec` of noisy, unstructured emergency distress text at the ingestion endpoint to stress-test backpressure and concurrency.
2. **Shock-Absorber Ingestion API (`apps/ingestion-api`)**: Captures incoming HTTP payloads into an in-memory buffer and immediately responds with `202 Accepted`, preventing Node.js event loop starvation. Every `100ms`, an atomic swap flushes the batch into Redis via `queue.addBulk()`—automatically rolling failed batches back into memory if Redis briefly disconnects.
3. **Redis & BullMQ Broker (`packages/config`)**: Decouples HTTP ingestion from heavy AI inference. Uses a multiplexed **Singleton** connection for high-throughput producers and a **Connection Factory** (`maxRetriesPerRequest: null`) to supply isolated blocking sockets to workers.
4. **Decoupled AI Worker (`apps/worker`)**: Consumes jobs asynchronously and calls the **Groq API** (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) with strict JSON schema enforcement (`temperature: 0.1`) to parse raw text into standardized coordinates, disaster classification, and severity levels. Failed or rate-limited requests retry with exponential backoff before routing to a **Dead Letter Queue (DLQ)**.
5. **Spatial Deduplication Engine (MongoDB)**: Prevents duplicate pins and distributed race conditions when dozens of victims report the same incident simultaneously. Encodes coordinates into a **7-character Geohash** (~50m spatial cell) and executes an atomic `findOneAndUpdate` (`$setOnInsert` + `$inc`) backed by a `2dsphere` geospatial index.
6. **Tactical Command Visualizer (`apps/visualizer`)**: An admin-only React & Leaflet command dashboard that hydrates active clusters from MongoDB on load, throttles incoming Socket.io events via a `1-second` client-side buffer to protect DOM performance, scales marker radius/color by severity and report density, and supports smooth `map.flyTo()` camera navigation from the live Intelligence Feed.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Ingestion & API** | Node.js, Express.js |
| **Queue & Message Broker** | Redis, BullMQ, `ioredis` |
| **AI Inference** | Groq SDK (LPU JSON-mode extraction) |
| **Spatial Persistence** | MongoDB, Mongoose (`2dsphere` index, Geohash spatial locks) |
| **Real-Time Transport** | Socket.io |
| **Command Frontend** | React, Vite, Leaflet (`react-leaflet`) |

---

## Monorepo Structure

```text
/disaster-grid
├── /apps
│   ├── /ingestion-api     # Express shock-absorber API, 100ms micro-batcher & REST endpoints
│   ├── /worker            # Standalone BullMQ consumer, Groq GeoJSON parser & MongoDB spatial upsert
│   ├── /chaos-simulator   # High-concurrency load generator (500+ req/s distress firehose)
│   └── /visualizer        # React + Leaflet Admin Triage Dashboard & Socket.io client
├── /packages
│   ├── /config            # Singleton & factory Redis connection pool manager
│   └── /shared-types      # Shared payload schemas and constants
└── /docs
    └── architecture.png   # Eraser.io system architecture diagram
```

---

## Key Engineering Highlights

* **Micro-Batching & Atomic Buffer Swaps**: Instead of opening a Redis round-trip per HTTP request (`queue.add`), the ingestion server buffers payloads in RAM and pipelines them via `queue.addBulk()` every `100ms`, cutting Redis network overhead by orders of magnitude.
* **Connection Pool Isolation**: Separates non-blocking producer sockets (multiplexed singleton) from blocking worker sockets (`BRPOPLPUSH` factory), preventing background job listeners from freezing API writes.
* **Database-Level Race Condition Locks**: Eliminates read-then-write race conditions across concurrent workers by pushing clustering down to MongoDB's atomic `findOneAndUpdate` operation keyed on a unique 7-character Geohash + disaster type.
* **Client-Side Render Throttling**: Reconciles MongoDB GeoJSON `[longitude, latitude]` coordinates into Leaflet `[latitude, longitude]` markers while batching real-time WebSocket bursts in a `1s` React buffer so the browser never drops frames under heavy load.

---

## Known Limitations & Engineering Trade-Offs

1. **100ms In-Memory Ingestion Volatility**: Buffering incoming requests in Node.js RAM for `100ms` before flushing to Redis trades a tiny durability window (up to 100ms of un-flushed payloads if the Express process experiences a hard power loss) for massive throughput gains. In a mission-critical deployment, an edge WAL (Write-Ahead Log) or Kafka topic would sit ahead of the memory buffer.
2. **Offline / Degraded Cellular Networks**: The current ingestion layer assumes HTTP connectivity from field devices. During severe disasters where cell towers and fiber backhaul fail, a production deployment would integrate **SMS gateways (Twilio)** and **mesh radio bridges (LoRaWAN)** feeding directly into `/api/ingest`.
3. **Frontend Operator Gate vs. Backend RBAC**: The visualizer uses a lightweight `sessionStorage` operator access gate (`AuthGate`) for frictionless command-center demos. In production, `GET /api/emergencies`, Socket.io handshakes, and `PATCH /resolve` dispatch endpoints would be enforced server-side via `HttpOnly` JWT cookies and role-based access control (RBAC).

---

## Local Setup & Execution

### Prerequisites
* **Node.js** (v18+)
* **Redis** running locally on `127.0.0.1:6379` (via Docker `docker run -p 6379:6379 -d redis` or WSL `sudo service redis-server start`)
* **MongoDB** instance (local or MongoDB Atlas URI)
* **Groq API Key**

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
MONGO_URI=mongodb://127.0.0.1:27017/disaster-grid
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Start the Distributed Processes
Run each service in its own terminal to observe process isolation:

```bash
# Terminal 1: Start the Ingestion API & Socket.io Server
node apps/ingestion-api/server.js

# Terminal 2: Start the Background AI & Spatial Worker
node apps/worker/processor.js

# Terminal 3: Start the React Tactical Command Center
cd apps/visualizer && npm run dev

# Terminal 4: Fire the Chaos Simulator (500+ req/s)
node apps/chaos-simulator/simulator.js
```

Open the visualizer in your browser, enter any operator callsign with the default command passcode (`GRID-CMD-2026`), and watch incoming distress clusters populate and scale in real time.
