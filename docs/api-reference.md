# API Reference — Royalty API

Base URL: `http://localhost:3001` (dev) or your deployed API URL.

All responses are JSON. All error responses follow the format:
```json
{ "error": "Human-readable message", "code": 404 }
```

---

## Health

### `GET /health`
Returns service health status.

**Response 200:**
```json
{ "status": "ok", "service": "royalty-api" }
```

---

## Tracks

### `GET /tracks`
List all registered tracks (paginated).

**Query parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `offset` | integer | 0 | Pagination offset |
| `limit` | integer | 20 | Results per page (max 100) |

**Response 200:**
```json
{
  "items": [
    {
      "track_id": "summer-collab-2024",
      "split_contract": "C...",
      "admin": "G...",
      "registered_at": "2024-07-23T12:00:00Z",
      "ledger_sequence": 12345678
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 20
}
```

---

### `POST /tracks`
Manually register a track (used by indexer or CLI tools).

**Request body:**
```json
{
  "track_id": "summer-collab-2024",
  "split_contract": "C...",
  "admin": "G...",
  "ledger_sequence": 12345678
}
```

**Response 200:** Track object (same as above).

**Errors:**
- `422` — track_id or split_contract is empty

---

### `GET /tracks/:id`
Get details for a specific track.

**Path params:** `id` — track identifier string.

**Response 200:** Track object.

**Errors:**
- `404` — Track not found

---

### `GET /tracks/:id/payments`
Get paginated payment history for a track.

**Query parameters:** Same as `GET /tracks`.

**Response 200:**
```json
{
  "items": [
    {
      "id": 1,
      "track_id": "summer-collab-2024",
      "payer": "G...",
      "token_address": "C...",
      "total_amount": 10000000,
      "paid_at": "2024-07-23T12:01:00Z",
      "tx_hash": "abc123...",
      "ledger_sequence": 12345679
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 20
}
```

---

### `GET /tracks/:id/events`
**Server-Sent Events stream.** Subscribe to real-time payment events for a track.

Connect with `EventSource`:
```javascript
const es = new EventSource('http://localhost:3001/tracks/my-track/events');
es.onmessage = (e) => {
  const payment = JSON.parse(e.data);
  // { track_id, payer, total_amount, tx_hash, paid_at }
};
```

- Heartbeat keepalive sent every 15 seconds
- Automatically reconnect with exponential backoff on disconnect

---

## Collaborators

### `GET /collaborator/:address/earnings`
Get total XLM earnings for a Stellar address across all tracks.

**Path params:** `address` — a G-address (56 characters).

**Response 200:**
```json
{
  "address": "G...",
  "total_earnings": 3500000,
  "payment_count": 3,
  "tracks": [
    {
      "track_id": "summer-collab-2024",
      "total": 2000000,
      "payment_count": 2
    },
    {
      "track_id": "winter-ep",
      "total": 1500000,
      "payment_count": 1
    }
  ]
}
```

> Note: `total_earnings` and `total` are in **stroops** (1 XLM = 10,000,000 stroops).

**Errors:**
- `422` — Invalid Stellar address format

---

## Error Codes

| HTTP | Meaning |
|------|---------|
| 404 | Resource not found |
| 422 | Validation error (bad input) |
| 429 | Rate limit exceeded |
| 500 | Internal server error / database error |
