#!/usr/bin/env python3
"""
OwlLogics Local MCP Brainstem — Budget Token Router
(c) 2024 Paul Adcock — Patent Pending — paul.dev.co@outlook.com

Deterministic routing layer that sits between user queries and the LLM.
Routes simple tasks to code (free), only calls Ollama for complex reasoning ($0 local).

MMS Pattern: Route → Replay → Expand → Compress → Index
"""

import json
import sqlite3
import hashlib
import re
import os
from datetime import datetime
from pathlib import Path

DB_PATH = Path.home() / ".owllogics" / "brainstem.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

class Brainstem:
    def __init__(self, db_path=None, ollama_url="http://localhost:11434"):
        self.db_path = str(db_path or DB_PATH)
        self.ollama_url = ollama_url
        self.conn = sqlite3.connect(self.db_path)
        self.init_db()
        self.tool_registry = {}
        self.register_defaults()
    
    def init_db(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS cache (
                query_hash TEXT PRIMARY KEY,
                query_text TEXT,
                response TEXT,
                intent TEXT,
                tool_used TEXT,
                tokens_saved INTEGER DEFAULT 0,
                created_at TEXT,
                hit_count INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS intent_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT,
                intent TEXT,
                tool TEXT,
                priority INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS stats (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                total_queries INTEGER DEFAULT 0,
                cache_hits INTEGER DEFAULT 0,
                tool_calls INTEGER DEFAULT 0,
                llm_calls INTEGER DEFAULT 0,
                tokens_saved INTEGER DEFAULT 0,
                estimated_cost_saved REAL DEFAULT 0.0
            );
            INSERT OR IGNORE INTO stats (id) VALUES (1);
        """)
        self.conn.commit()
    
    def register_defaults(self):
        """Register built-in deterministic tools (no LLM needed)."""
        patterns = [
            # Math
            (r'^[\d\s\+\-\*\/\(\)\.]+$', 'math', 'calc'),
            (r'calculate|compute|what is.*\d', 'math', 'calc'),
            # Time/date
            (r'what time|current time|what date|today|now', 'time', 'time'),
            # Git
            (r'^git (status|log|push|pull|add|commit|diff|branch)', 'git', 'git'),
            (r'commit and push|push to git|push to github', 'git_batch', 'git_batch'),
            # Syntax check
            (r'check (syntax|valid)|node --check|syntax check', 'syntax_check', 'syntax'),
            # Search
            (r'find|search|grep|look for', 'search', 'search_files'),
            # Sequencing
            (r'sequence|sequencing|order parts|build order', 'sequencing', 'sequence_opt'),
            # Load optimization
            (r'optimize.*load|trailer load|load plan|maximize.*trailer', 'load_opt', 'load_opt'),
            # Anomaly
            (r'anomal|error.*rate|detect.*error|scan.*report', 'anomaly', 'anomaly'),
            # Help
            (r'^help$|^what can you|^commands$|^list tools', 'help', 'help'),
            # Status
            (r'^status$|^health$|^system status', 'status', 'status'),
        ]
        for pattern, intent, tool in patterns:
            self.conn.execute(
                "INSERT INTO intent_patterns (pattern, intent, tool, priority) VALUES (?, ?, ?, ?)",
                (pattern, intent, tool, 10)
            )
        self.conn.commit()
        
        # Register tool handlers
        self.tool_registry['calc'] = self._tool_calc
        self.tool_registry['time'] = self._tool_time
        self.tool_registry['git'] = self._tool_git
        self.tool_registry['git_batch'] = self._tool_git_batch
        self.tool_registry['syntax'] = self._tool_syntax
        self.tool_registry['search_files'] = self._tool_search
        self.tool_registry['sequence_opt'] = self._tool_sequence
        self.tool_registry['load_opt'] = self._tool_load_opt
        self.tool_registry['anomaly'] = self._tool_anomaly
        self.tool_registry['help'] = self._tool_help
        self.tool_registry['status'] = self._tool_status
    
    def route(self, query):
        """Main routing function — Route → Replay → Expand → Compress → Index."""
        self._increment_stat('total_queries')
        
        # 1. Hash the query for cache lookup
        qhash = hashlib.sha256(query.lower().strip().encode()).hexdigest()[:16]
        
        # 2. Replay — check cache first (0 LLM cost)
        cached = self.conn.execute(
            "SELECT response, intent, tool_used FROM cache WHERE query_hash = ?", (qhash,)
        ).fetchone()
        if cached:
            self._increment_stat('cache_hits')
            self._increment_stat('tokens_saved', 500)
            self.conn.execute("UPDATE cache SET hit_count = hit_count + 1 WHERE query_hash = ?", (qhash,))
            self.conn.commit()
            return {
                "source": "cache",
                "response": cached[0],
                "intent": cached[1],
                "tool": cached[2],
                "cost": 0,
                "tokens_saved": 500
            }
        
        # 3. Route — match against deterministic patterns
        intent, tool = self._match_intent(query)
        
        if tool and tool in self.tool_registry:
            # 4. Expand — run deterministic tool (0 LLM cost)
            self._increment_stat('tool_calls')
            result = self.tool_registry[tool](query)
            
            # 5. Compress + Index — cache the result
            response_str = json.dumps(result, default=str)
            self._cache_response(qhash, query, response_str, intent, tool, 500)
            self._increment_stat('tokens_saved', 500)
            
            return {
                "source": "deterministic",
                "response": result,
                "intent": intent,
                "tool": tool,
                "cost": 0,
                "tokens_saved": 500
            }
        
        # 6. Fallback — needs LLM (local Ollama, still $0)
        self._increment_stat('llm_calls')
        result = self._call_ollama(query)
        
        # Cache it
        self._cache_response(qhash, query, result, "llm", "ollama", 200)
        
        return {
            "source": "llm",
            "response": result,
            "intent": "llm",
            "tool": "ollama",
            "cost": 0,
            "tokens_saved": 0
        }
    
    def _match_intent(self, query):
        """Match query against registered patterns."""
        patterns = self.conn.execute(
            "SELECT pattern, intent, tool FROM intent_patterns ORDER BY priority DESC"
        ).fetchall()
        
        q_lower = query.lower().strip()
        for pattern, intent, tool in patterns:
            try:
                if re.search(pattern, q_lower, re.IGNORECASE):
                    return intent, tool
            except:
                continue
        return "llm", "ollama"
    
    def _cache_response(self, qhash, query, response, intent, tool, tokens_saved):
        self.conn.execute(
            "INSERT OR REPLACE INTO cache (query_hash, query_text, response, intent, tool_used, tokens_saved, created_at, hit_count) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
            (qhash, query, response, intent, tool, tokens_saved, datetime.now().isoformat())
        )
        self.conn.commit()
    
    def _increment_stat(self, key, val=1):
        if key == 'tokens_saved':
            self.conn.execute("UPDATE stats SET tokens_saved = tokens_saved + ?, estimated_cost_saved = estimated_cost_saved + ? WHERE id = 1", (val, val * 0.00002))
        else:
            self.conn.execute(f"UPDATE stats SET {key} = {key} + ? WHERE id = 1", (val,))
        self.conn.commit()
    
    def _call_ollama(self, prompt):
        """Call local Ollama — $0 cost."""
        try:
            import urllib.request
            data = json.dumps({
                "model": "qwen3:4b",
                "prompt": prompt,
                "stream": False,
                "options": {"num_ctx": 2048, "temperature": 0.3}
            }).encode()
            req = urllib.request.Request(
                f"{self.ollama_url}/api/generate",
                data=data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read())
                return result.get("response", "[No response]")
        except Exception as e:
            return f"[Ollama unavailable: {str(e)}]"
    
    # ── Deterministic Tools (0 LLM cost) ──────────────────────
    
    def _tool_calc(self, query):
        expr = re.sub(r'[^0-9\+\-\*\/\(\)\.\s]', '', query)
        try:
            result = eval(expr)
            return {"operation": "calc", "expression": expr, "result": result, "cost": 0}
        except:
            return {"error": "Invalid expression", "cost": 0}
    
    def _tool_time(self, query):
        now = datetime.now()
        return {
            "time": now.strftime("%H:%M:%S"),
            "date": now.strftime("%Y-%m-%d"),
            "day": now.strftime("%A"),
            "iso": now.isoformat(),
            "cost": 0
        }
    
    def _tool_git(self, query):
        import subprocess
        try:
            result = subprocess.run(
                query.split(), capture_output=True, text=True, timeout=10,
                cwd=str(Path.home() / "AutoSeq")
            )
            return {
                "command": query,
                "stdout": result.stdout[:500],
                "stderr": result.stderr[:200],
                "exit_code": result.returncode,
                "cost": 0
            }
        except Exception as e:
            return {"error": str(e), "cost": 0}
    
    def _tool_git_batch(self, query):
        import subprocess
        cwd = str(Path.home() / "AutoSeq")
        commands = [
            ["git", "add", "-A"],
            ["git", "commit", "-m", f"Auto-commit: {datetime.now().strftime('%Y-%m-%d %H:%M')}"],
            ["git", "push", "origin", "main"]
        ]
        results = []
        for cmd in commands:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=30, cwd=cwd)
            results.append({"cmd": " ".join(cmd), "exit": r.returncode, "out": r.stdout[:200]})
        return {"batch": "git add+commit+push", "results": results, "cost": 0}
    
    def _tool_syntax(self, query):
        import subprocess
        js_files = list((Path.home() / "AutoSeq" / "js").glob("*.js"))
        results = []
        for f in js_files:
            r = subprocess.run(["node", "--check", str(f)], capture_output=True, text=True, timeout=5)
            results.append({"file": f.name, "ok": r.returncode == 0, "error": r.stderr[:100] if r.stderr else ""})
        return {"checked": len(results), "results": results, "cost": 0}
    
    def _tool_search(self, query):
        import subprocess
        term = re.sub(r'find|search|grep|look for|for', '', query, flags=re.IGNORECASE).strip()
        r = subprocess.run(
            ["rg", "-l", term, str(Path.home() / "AutoSeq")],
            capture_output=True, text=True, timeout=10
        )
        files = r.stdout.strip().split('\n') if r.stdout.strip() else []
        return {"term": term, "files": files[:20], "count": len(files), "cost": 0}
    
    def _tool_sequence(self, query):
        return {
            "tool": "sequence_optimizer",
            "message": "Sequence optimization available — uses weight + size sorting",
            "algorithm": "Local rule-based (patent pending)",
            "cost": 0
        }
    
    def _tool_load_opt(self, query):
        return {
            "tool": "load_optimizer",
            "message": "Trailer load optimization available — DOT axle compliance",
            "trailer_types": ["53ft Dry Van", "53ft Flatbed", "53ft Reefer", "48ft Flatbed", "28ft Dock"],
            "cost": 0
        }
    
    def _tool_anomaly(self, query):
        return {
            "tool": "anomaly_detector",
            "checks": ["error_rate > 5%", "slow_scans > 30s", "operator_errors > 3"],
            "cost": 0
        }
    
    def _tool_help(self, query):
        return {
            "tools": list(self.tool_registry.keys()),
            "description": "Deterministic tools — 0 LLM cost. Complex queries fall back to Ollama (local, $0).",
            "cost": 0
        }
    
    def _tool_status(self, query):
        stats = self.conn.execute("SELECT * FROM stats WHERE id = 1").fetchone()
        cols = [d[0] for d in self.conn.execute("SELECT * FROM stats WHERE id = 1").description]
        return dict(zip(cols, stats)) if stats else {"error": "no stats"}
    
    def get_stats(self):
        return self._tool_status("status")
    
    def close(self):
        self.conn.close()


if __name__ == "__main__":
    bs = Brainstem()
    
    # Demo: run a bunch of queries and show the savings
    test_queries = [
        "what time is it",
        "calculate 45000 / 26",
        "git status",
        "check syntax",
        "what time is it",  # cache hit
        "calculate 12 * 3500",  # math
        "optimize trailer load",  # deterministic
        "detect anomalies",  # deterministic
        "what time is it",  # cache hit again
        "help",
    ]
    
    print("=== OwlLogics Brainstem — Budget Token Router ===\n")
    for q in test_queries:
        result = bs.route(q)
        src = result["source"]
        saved = result.get("tokens_saved", 0)
        print(f"  [{src:12s}] tokens_saved={saved:4d} | {q}")
    
    print("\n=== Stats ===")
    stats = bs.get_stats()
    print(json.dumps(stats, indent=2))
    print(f"\nEstimated cost saved: ${stats.get('estimated_cost_saved', 0):.4f}")
    bs.close()
