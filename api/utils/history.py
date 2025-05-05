import redis

class EmptyStackError(Exception):
    def __init__(self, message: str):
        super().__init__(message)

class History:
    def __init__(self, session_id: str):
        self.r = redis.Redis(host='redis', port=6379, decode_responses=True)
        self.undo_key = f"{session_id}:undo"
        self.redo_key = f"{session_id}:redo"

    def add_undo(self, data):
        import json
        self.r.lpush(self.undo_key, json.dumps(data))
        self.r.delete(self.redo_key)

    def undo(self):
        import json
        if self.r.llen(self.undo_key) == 0:
            raise EmptyStackError("Nothing to undo")
        last = self.r.lpop(self.undo_key)
        self.r.lpush(self.redo_key, last)
        return json.loads(last)

    def redo(self):
        import json
        if self.r.llen(self.redo_key) == 0:
            raise EmptyStackError("Nothing to redo")
        last = self.r.lpop(self.redo_key)
        self.r.lpush(self.undo_key, last)
        return json.loads(last)

    def reset(self):
        self.r.delete(self.undo_key)
        self.r.delete(self.redo_key)

    def get_current(self):
        import json
        current = self.r.lindex(self.undo_key, 0)
        if current:
            return json.loads(current)
        return ""
