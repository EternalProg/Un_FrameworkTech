# LAB 7 CURL Commands

## 0) Start API

```bash
npm run start
```

Optional:

```bash
BASE_URL="http://127.0.0.1:3000"
API_KEY="12345678"
```

## 1) CSV export without transform

```bash
curl -i "$BASE_URL/api/v1/items/export"
```

## 2) CSV export with Transform stream (`isActive`)

```bash
curl -i "$BASE_URL/api/v1/items/export?transform=true"
```

## 3) NDJSON stream endpoint

```bash
curl -i "$BASE_URL/api/v1/items/stream"
```

Expected `Content-Type`: `application/x-ndjson`.

## 4) WebSocket demo + REST notifications

Open browser console and run:

```js
const ws = new WebSocket('ws://127.0.0.1:3000/api/v1/items/ws');
ws.onmessage = (event) => console.log('WS message:', JSON.parse(event.data));
```

Then in terminal run REST calls and watch console messages:

```bash
curl -i -X POST "$BASE_URL/api/v1/items" \
  -H "Content-Type: application/json" \
  -d '{"device":"WS Demo Device","room":"Lab","status":"on","description":"created from curl"}'

curl -i -X PATCH "$BASE_URL/api/v1/items/1" \
  -H "Content-Type: application/json" \
  -d '{"status":"off"}'

curl -i -X DELETE "$BASE_URL/api/v1/items/1"
```

Expected WS events:

- `{ "event": "snapshot", "data": [...] }` on connect
- `{ "event": "created", "data": { ... } }` after POST
- `{ "event": "updated", "data": { ... } }` after PATCH
- `{ "event": "deleted", "id": 1 }` after DELETE

## 5) Download gzip backup by timestamp

Get available backup names:

```bash
ls data/backups
```

Use filename without `.gz` extension as `timestamp`:

```bash
curl -i -H "x-api-key: $API_KEY" "$BASE_URL/api/v1/backups/2026-04-26T13-14-27-213Z"
```

Unauthorized request example:

```bash
curl -i "$BASE_URL/api/v1/backups/2026-04-26T13-14-27-213Z"
```
