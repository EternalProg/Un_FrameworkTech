# LAB 6 CURL Commands

## 0) Start servers

Terminal 1 (external service):

```bash
npm run external
```

Terminal 2 (main API):

```bash
npm run start
```

Optional variable:

```bash
BASE_URL="http://127.0.0.1:3000"
```

If GitHub endpoints return rate limit errors, set token in `.env`:

```bash
GITHUB_TOKEN=your_github_token
```

Sampling controls for GitHub analytics (`0` = no cap):

```bash
GITHUB_ANALYTICS_MAX_CONTRIBUTORS=0
GITHUB_ANALYTICS_MAX_EVENTS=0
GITHUB_ANALYTICS_MAX_CANDIDATES=0
```

## 2) Versioned API routes

```bash
curl -i "$BASE_URL/api/v1/health"
curl -i "$BASE_URL/api/v1/items"
curl -i "$BASE_URL/api/v1/items/export"
```

## 4) Pagination for /api/v2/items

```bash
curl -i "$BASE_URL/api/v2/items?page=1&limit=1"
curl -i "$BASE_URL/api/v2/items?page=2&limit=1"
```

## 5) Rate limiting (100 req/min)

```bash
for i in $(seq 1 110); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/health")
  echo "request $i -> $code"
  if [ "$code" = "429" ]; then
    break
  fi
done
```

## 6) Swagger docs

```bash
curl -i "$BASE_URL/docs"
curl -i "$BASE_URL/docs/json"
```

## 7) External details endpoint (JSON Server running)

```bash
curl -i "$BASE_URL/api/v1/items/1/details"
```

## 7) External details endpoint fallback (JSON Server stopped)

Stop Terminal 1 (Ctrl+C), then run:

```bash
rm -f data/cache/reference.json
curl -i "$BASE_URL/api/v1/items/1/details"
```

Expected: HTTP 200, but `external` fields are `null`.

## 8) GitHub analytics v1 and v2

https://docs.github.com/en/rest/repos/repos?apiVersion=2026-03-10#list-repository-contributors

```bash
curl -i "$BASE_URL/api/v1/github/shared-repos?repo=fastify/fastify"
curl -i "$BASE_URL/api/v2/github/shared-repos?repo=fastify/fastify"
```

More repos to demonstrate bigger contributor sets:

```bash
curl -i "$BASE_URL/api/v1/github/shared-repos?repo=nodejs/node"
curl -i "$BASE_URL/api/v1/github/shared-repos?repo/kubernetes/kubernetes"
curl -i "$BASE_URL/api/v1/github/shared-repos?repo=torvalds/linux"

curl -i "$BASE_URL/api/v2/github/shared-repos?repo=nodejs/node"
curl -i "$BASE_URL/api/v2/github/shared-repos?repo=kubernetes/kubernetes"
curl -i "$BASE_URL/api/v2/github/shared-repos?repo=torvalds/linux"
```
