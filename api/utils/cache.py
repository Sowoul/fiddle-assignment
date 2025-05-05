import redis
import hashlib
import json

class Cache:
    def __init__(self, session_id: str):
        self.r = redis.Redis(host='redis', port=6379, decode_responses=True)

    def addCache(self, key: str, value: str):
        self.r.set(key, value)
        self.r.expire(key, 300)

    def getCache(self, key: str) -> str | None:
        return self.r.get(key) or None
