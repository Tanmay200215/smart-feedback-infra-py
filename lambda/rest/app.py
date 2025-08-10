import json, os, uuid, time, re, string, boto3
from collections import Counter, defaultdict

TABLE_NAME = os.environ["feedback"]
BUCKET_NAME = os.environ["feedbacksubmit"]
CACHE_TO_S3 = os.environ.get("CACHE_INSIGHTS_TO_S3", "false").lower() == "true"

ddb = boto3.resource("dynamodb")
table = ddb.Table(feedback)
s3 = boto3.client("s3")

STOPWORDS = set("a an and are as at be by for from has he in is it its of on that the to was were will with you your we our they them this those these i me my".split())
POS_WORDS = set("great good excellent love amazing smooth fast helpful friendly awesome delighted happy satisfied fantastic".split())
NEG_WORDS = set("bad poor slow confusing bug error issue difficult expensive frustrating terrible unhappy disappointed".split())

def _now_ms(): return int(time.time()*1000)

def _tokenize(txt):
    txt = (txt or "").lower()
    txt = re.sub(r"http\S+|[@#]\S+", " ", txt)
    txt = txt.translate(str.maketrans("", "", string.punctuation))
    return [t for t in txt.split() if t and t not in STOPWORDS]

def _sentiment_score(text):
    toks = _tokenize(text)
    pos = sum(1 for t in toks if t in POS_WORDS)
    neg = sum(1 for t in toks if t in NEG_WORDS)
    if pos - neg > 0: return "positive"
    if pos - neg < 0: return "negative"
    return "neutral"

def _top_ngrams(items, n=(1,2)):
    counts = Counter()
    for it in items:
        toks = _tokenize(it.get("message") or it.get("comment") or "")
        for k in n:
            for i in range(len(toks)-k+1):
                ng = " ".join(toks[i:i+k])
                if ng: counts[ng] += 1
    return [w for w,_ in counts.most_common(10)]

def _summarize(items, max_sentences=3):
    sents = []
    for it in items:
        text = (it.get("message") or it.get("comment") or "").strip()
        for s in re.split(r"(?<=[.!?])\s+", text):
            s = s.strip()
            if 30 <= len(s) <= 240: sents.append(s)
    if not sents: return "Not enough content to summarize."
    term_freq = Counter()
    for s in sents: term_freq.update([t for t in _tokenize(s) if len(t) > 2])
    if not term_freq: return "Not enough content to summarize."
    scored = []
    for s in sents:
        toks = _tokenize(s)
        score = sum(term_freq[t] for t in toks) / (len(toks) + 1)
        scored.append((score, s))
    return " ".join(s for _, s in sorted(scored, key=lambda x: x[0], reverse=True)[:max_sentences])

def _aggregate(items):
    by = defaultdict(lambda: {"positive":0,"neutral":0,"negative":0,"topThemes":[]})
    for it in items:
        p = it.get("product") or "Unknown"
        s = it.get("sentiment") or _sentiment_score(it.get("message") or it.get("comment") or "")
        by[p][s] += 1
    for p in by:
        msgs = [it for it in items if (it.get("product") or "Unknown") == p]
        by[p]["topThemes"] = _top_ngrams(msgs)[:3]
    return by

def _scan_all():
    out = []
    resp = table.scan()
    out.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
        out.extend(resp.get("Items", []))
    return out

def _seed_from_s3():
    try:
        obj = s3.get_object(Bucket=feedbacksubmit, Key="seed/feedback.jsonl")
        lines = obj["Body"].read().decode("utf-8").splitlines()
        with table.batch_writer(overwrite_by_pkeys=["feedbackId"]) as bw:
            for line in lines:
                if not line.strip(): continue
                item = json.loads(line)
                item.setdefault("feedbackId", str(uuid.uuid4()))
                item.setdefault("timestamp", _now_ms())
                msg = item.get("message") or item.get("comment") or ""
                item.setdefault("sentiment", _sentiment_score(msg))
                bw.put_item(Item=item)
        return {"ok": True, "loaded": len(lines)}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def _compute_and_maybe_cache_insights(items):
    payload = {"byProduct": _aggregate(items), "summary": _summarize(items)}
    if CACHE_TO_S3:
        s3.put_object(Bucket=feedbacksubmit, Key="exports/insights.json",
                      Body=json.dumps(payload).encode("utf-8"),
                      ContentType="application/json")
    return payload

def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type":"application/json",
            "Access-Control-Allow-Origin":"*",
            "Access-Control-Allow-Headers":"*",
            "Access-Control-Allow-Methods":"GET,POST,OPTIONS"
        },
        "body": json.dumps(body)
    }

def handler(event, context):
    if isinstance(event, dict) and event.get("action") == "seedFromS3":
        r = _seed_from_s3(); return _resp(200 if r.get("ok") else 500, r)
    if isinstance(event, dict) and event.get("action") == "refreshInsights":
        payload = _compute_and_maybe_cache_insights(_scan_all())
        counts = {k: sum(payload["byProduct"][k][x] for x in ("positive","neutral","negative"))
                  for k in payload["byProduct"]}
        return _resp(200, {"ok": True, "counts": counts})

    path = event.get("rawPath") or event.get("path") or ""
    method = (event.get("requestContext", {}).get("http", {}) or {}).get("method") or event.get("httpMethod") or "GET"

    body = event.get("body");  parsed = {}
    if body and event.get("isBase64Encoded"):
        import base64; body = base64.b64decode(body)
    try: parsed = json.loads(body) if body else {}
    except: pass

    if path.endswith("/feedback") and method == "POST":
        item = {
            "feedbackId": str(uuid.uuid4()),
            "name": parsed.get("name",""),
            "email": parsed.get("email",""),
            "product": parsed.get("product",""),
            "message": parsed.get("comment") or parsed.get("message",""),
            "timestamp": _now_ms(),
        }
        item["sentiment"] = _sentiment_score(item["message"])
        table.put_item(Item=item)
        return _resp(200, {"ok": True, "id": item["feedbackId"]})

    if path.endswith("/feedback") and method == "GET":
        params = event.get("queryStringParameters") or {}
        items = sorted(_scan_all(), key=lambda x: x.get("timestamp",0),
                       reverse=(params.get("order","desc")=="desc"))
        limit = int(params.get("limit", 50))
        return _resp(200, items[:limit])

    if path.endswith("/insights") and method == "GET":
        try:
            obj = s3.get_object(Bucket=feedbacksubmit, Key="exports/insights.json")
            cached = json.loads(obj["Body"].read().decode("utf-8"))
            return _resp(200, cached)
        except Exception:
            pass
        return _resp(200, _compute_and_maybe_cache_insights(_scan_all()))

    if method == "OPTIONS": return _resp(200, {"ok": True})
    return _resp(404, {"error":"Not found"})
