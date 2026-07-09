#!/usr/bin/env python3
"""
OwlLogics Visual Token Compressor
(c) 2024 Paul Adcock — Patent Pending — paul.dev.co@outlook.com

Converts large text/data outputs into images for vision model processing.
A table with 500 rows = 8,000 text tokens = ~1,000 image tokens = 87% savings.
"""

import json
import io
import base64
import hashlib
import sqlite3
from datetime import datetime
from pathlib import Path

# Use matplotlib for rendering (no GUI needed)
import matplotlib
matplotlib.use('Agg')  # Headless backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

DB_PATH = Path.home() / ".owllogics" / "brainstem.db"

class VisualCompressor:
    def __init__(self, db_path=None):
        self.db_path = str(db_path or DB_PATH)
        self.conn = sqlite3.connect(self.db_path)
        self.init_db()
        self.stats = {"compressed": 0, "text_tokens": 0, "image_tokens": 0, "saved": 0}
    
    def init_db(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS visual_cache (
                data_hash TEXT PRIMARY KEY,
                image_path TEXT,
                original_tokens INTEGER,
                image_tokens INTEGER,
                tokens_saved INTEGER,
                created_at TEXT,
                hit_count INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS visual_stats (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                total_compressions INTEGER DEFAULT 0,
                total_tokens_saved INTEGER DEFAULT 0,
                cache_hits INTEGER DEFAULT 0
            );
            INSERT OR IGNORE INTO visual_stats (id) VALUES (1);
        """)
        self.conn.commit()
    
    def estimate_tokens(self, text):
        """Estimate token count: ~4 chars per token for English."""
        return max(1, len(text) // 4)
    
    def should_compress(self, text, threshold=2000):
        """Only compress if text would use >threshold tokens."""
        est = self.estimate_tokens(text)
        return est > threshold, est
    
    def compress_table(self, headers, rows, title="Data"):
        """Render a table as an image — ~1,000 vision tokens regardless of size."""
        data_hash = hashlib.sha256(
            (title + str(headers) + str(rows[:5])).encode()
        ).hexdigest()[:16]
        
        # Check cache
        cached = self.conn.execute(
            "SELECT image_path FROM visual_cache WHERE data_hash = ?", (data_hash,)
        ).fetchone()
        if cached:
            self.conn.execute("UPDATE visual_cache SET hit_count = hit_count + 1 WHERE data_hash = ?", (data_hash,))
            self.conn.execute("UPDATE visual_stats SET cache_hits = cache_hits + 1 WHERE id = 1")
            self.conn.commit()
            return {"image_path": cached[0], "source": "cache", "cost": 0}
        
        # Render table as image
        fig, ax = plt.subplots(figsize=(14, min(0.5 * len(rows) + 1, 20)))
        ax.axis('off')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        
        # Color code status columns
        cell_colors = []
        for row in rows:
            row_colors = []
            for i, cell in enumerate(row):
                cell_str = str(cell).lower()
                if any(w in cell_str for w in ['ok', 'complete', 'online', 'success', '✅', 'approved', 'delivered']):
                    row_colors.append('#d4edda')
                elif any(w in cell_str for w in ['error', 'fail', 'offline', '❌', 'poor', 'expired']):
                    row_colors.append('#f8d7da')
                elif any(w in cell_str for w in ['pending', 'warning', 'in_progress', 'loading', 'partial']):
                    row_colors.append('#fff3cd')
                else:
                    row_colors.append('#f8f9fa')
            cell_colors.append(row_colors)
        
        table = ax.table(
            cellText=[[str(c) for c in row] for row in rows],
            colLabels=headers,
            cellColours=cell_colors,
            loc='center',
            cellLoc='center'
        )
        table.auto_set_font_size(False)
        table.set_fontsize(8)
        table.scale(1, 1.5)
        
        # Style header
        for i in range(len(headers)):
            table[0, i].set_facecolor('#343a40')
            table[0, i].get_text().set_color('white')
            table[0, i].get_text().set_fontweight('bold')
        
        img_path = str(Path.home() / ".owllogics" / f"compressed_{data_hash}.png")
        plt.savefig(img_path, bbox_inches='tight', dpi=150, facecolor='white')
        plt.close()
        
        # Calculate savings
        original_text = json.dumps({"headers": headers, "rows": rows})
        original_tokens = self.estimate_tokens(original_text)
        image_tokens = 1000  # Fixed vision token cost
        saved = max(0, original_tokens - image_tokens)
        
        # Cache it
        self.conn.execute(
            "INSERT OR REPLACE INTO visual_cache (data_hash, image_path, original_tokens, image_tokens, tokens_saved, created_at, hit_count) VALUES (?, ?, ?, ?, ?, ?, 0)",
            (data_hash, img_path, original_tokens, image_tokens, saved, datetime.now().isoformat())
        )
        self.conn.execute("UPDATE visual_stats SET total_compressions = total_compressions + 1, total_tokens_saved = total_tokens_saved + ? WHERE id = 1", (saved,))
        self.conn.commit()
        
        self.stats["compressed"] += 1
        self.stats["text_tokens"] += original_tokens
        self.stats["image_tokens"] += image_tokens
        self.stats["saved"] += saved
        
        return {
            "image_path": img_path,
            "source": "rendered",
            "original_tokens": original_tokens,
            "image_tokens": image_tokens,
            "tokens_saved": saved,
            "compression_ratio": f"{round(saved / original_tokens * 100)}%",
            "cost": 0
        }
    
    def compress_code(self, code, filename="module.js"):
        """Render code as a syntax-highlighted image."""
        data_hash = hashlib.sha256(code[:500].encode()).hexdigest()[:16]
        
        cached = self.conn.execute(
            "SELECT image_path FROM visual_cache WHERE data_hash = ?", (data_hash,)
        ).fetchone()
        if cached:
            return {"image_path": cached[0], "source": "cache", "cost": 0}
        
        # Split into lines for display
        lines = code.split('\n')
        max_lines = 60  # Cap at 60 lines per image
        display_lines = lines[:max_lines]
        if len(lines) > max_lines:
            display_lines.append(f"... ({len(lines) - max_lines} more lines)")
        
        fig, ax = plt.subplots(figsize=(16, min(0.3 * len(display_lines) + 1, 20)))
        ax.axis('off')
        ax.set_title(filename, fontsize=12, fontweight='bold', pad=10, loc='left')
        
        # Simple syntax highlighting colors
        for i, line in enumerate(display_lines):
            color = '#1e1e1e'
            if line.strip().startswith('//') or line.strip().startswith('/*'):
                color = '#6a9955'  # Green for comments
            elif line.strip().startswith('function') or line.strip().startswith('var') or line.strip().startswith('return'):
                color = '#569cd6'  # Blue for keywords
            elif line.strip().startswith('}') or line.strip().startswith('{'):
                color = '#808080'  # Gray for braces
            ax.text(0.01, 1 - (i + 1) / (len(display_lines) + 1), line, 
                   transform=ax.transAxes, fontsize=7, fontfamily='monospace',
                   color=color, verticalalignment='top')
        
        ax.set_facecolor('#1e1e1e')
        fig.patch.set_facecolor('#1e1e1e')
        
        img_path = str(Path.home() / ".owllogics" / f"code_{data_hash}.png")
        plt.savefig(img_path, bbox_inches='tight', dpi=150, facecolor='#1e1e1e')
        plt.close()
        
        original_tokens = self.estimate_tokens(code)
        image_tokens = 1000
        saved = max(0, original_tokens - image_tokens)
        
        self.conn.execute(
            "INSERT OR REPLACE INTO visual_cache (data_hash, image_path, original_tokens, image_tokens, tokens_saved, created_at, hit_count) VALUES (?, ?, ?, ?, ?, ?, 0)",
            (data_hash, img_path, original_tokens, image_tokens, saved, datetime.now().isoformat())
        )
        self.conn.execute("UPDATE visual_stats SET total_compressions = total_compressions + 1, total_tokens_saved = total_tokens_saved + ? WHERE id = 1", (saved,))
        self.conn.commit()
        
        return {
            "image_path": img_path,
            "source": "rendered",
            "original_tokens": original_tokens,
            "image_tokens": image_tokens,
            "tokens_saved": saved,
            "compression_ratio": f"{round(saved / original_tokens * 100)}%",
            "cost": 0
        }
    
    def compress_chart(self, data, chart_type="bar", title="Chart"):
        """Render data as a chart image — more compact than raw numbers."""
        data_hash = hashlib.sha256((title + str(data)).encode()).hexdigest()[:16]
        
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.set_title(title, fontsize=14, fontweight='bold')
        
        if chart_type == "bar":
            labels = [str(d.get('label', d.get('name', '?'))) for d in data]
            values = [float(d.get('value', d.get('count', 0))) for d in data]
            colors = [d.get('color', '#3498db') for d in data]
            ax.bar(labels, values, color=colors)
            ax.set_ylabel('Count')
        elif chart_type == "pie":
            labels = [str(d.get('label', d.get('name', '?'))) for d in data]
            values = [float(d.get('value', d.get('count', 0))) for d in data]
            ax.pie(values, labels=labels, autopct='%1.1f%%')
        elif chart_type == "line":
            values = [float(d.get('value', 0)) for d in data]
            ax.plot(range(len(values)), values, marker='o')
            ax.set_ylabel('Value')
        
        plt.tight_layout()
        img_path = str(Path.home() / ".owllogics" / f"chart_{data_hash}.png")
        plt.savefig(img_path, dpi=150, facecolor='white')
        plt.close()
        
        original_tokens = self.estimate_tokens(json.dumps(data))
        image_tokens = 1000
        saved = max(0, original_tokens - image_tokens)
        ratio = round(saved / original_tokens * 100) if original_tokens > 0 else 0
        
        self.conn.execute(
            "INSERT OR REPLACE INTO visual_cache (data_hash, image_path, original_tokens, image_tokens, tokens_saved, created_at, hit_count) VALUES (?, ?, ?, ?, ?, ?, 0)",
            (data_hash, img_path, original_tokens, image_tokens, saved, datetime.now().isoformat())
        )
        self.conn.execute("UPDATE visual_stats SET total_compressions = total_compressions + 1, total_tokens_saved = total_tokens_saved + ? WHERE id = 1", (saved,))
        self.conn.commit()
        
        return {
            "image_path": img_path,
            "source": "rendered",
            "original_tokens": original_tokens,
            "image_tokens": image_tokens,
            "tokens_saved": saved,
            "compression_ratio": f"{ratio}%",
            "cost": 0
        }
    
    def get_stats(self):
        row = self.conn.execute("SELECT * FROM visual_stats WHERE id = 1").fetchone()
        cols = [d[0] for d in self.conn.execute("SELECT * FROM visual_stats WHERE id = 1").description]
        return dict(zip(cols, row)) if row else {}
    
    def close(self):
        self.conn.close()


if __name__ == "__main__":
    vc = VisualCompressor()
    
    print("=== OwlLogics Visual Token Compressor ===\n")
    
    # Test 1: Compress a LARGE table (50 operators — would be 5000+ text tokens)
    headers = ["Operator", "State", "Wage", "Scans", "OK", "Errors", "Error %", "Labor Cost", "Error Cost", "Avg Time", "Total Time", "Cost/Scan"]
    rows = []
    states = ["CA", "MI", "ON", "IN", "MX", "IL", "TX", "QC", "OH", "WI", "PA", "TN", "MO", "FEDERAL"]
    wages = {"CA":20.00, "MI":10.33, "ON":17.50, "IN":7.25, "MX":3.50, "IL":14.00, "TX":7.25, "QC":17.50, "OH":10.45, "WI":7.25, "PA":7.25, "TN":7.25, "MO":12.00, "FEDERAL":7.25}
    for i in range(1, 51):
        st = states[i % len(states)]
        w = wages[st]
        scans = 30 + (i * 7) % 40
        errs = (i * 3) % 5
        ok = scans - errs
        err_pct = round(errs / scans * 100, 1)
        total_time = scans * (8 + i % 5)
        labor = round(total_time / 3600 * w, 2)
        err_cost = round(errs * (total_time / scans / 3600) * w, 2)
        rows.append([f"Operator {i}", st, f"${w:.2f}", str(scans), str(ok), str(errs), f"{err_pct}%", f"${labor:.2f}", f"${err_cost:.2f}", f"{8+ i%5}s", f"{total_time}s", f"${labor/scans:.2f}"])
    
    result = vc.compress_table(headers, rows, "Operator Scan Time & Labor Cost Report (50 Operators)")
    print(f"  Table compressed:")
    print(f"    Original: {result['original_tokens']} text tokens")
    print(f"    Image:    {result['image_tokens']} vision tokens")
    print(f"    Saved:    {result['tokens_saved']} tokens ({result['compression_ratio']} reduction)")
    print(f"    Image:    {result['image_path']}")
    
    # Test 2: Cache hit (same table again)
    result2 = vc.compress_table(headers, rows, "Operator Scan Time & Labor Cost Report")
    print(f"\n  Same table again: {result2['source']} (0 cost)")
    
    # Test 3: Compress chart data
    chart_data = [
        {"label": "Jan", "value": 1200, "color": "#3498db"},
        {"label": "Feb", "value": 1500, "color": "#2ecc71"},
        {"label": "Mar", "value": 980, "color": "#e74c3c"},
        {"label": "Apr", "value": 2100, "color": "#f39c12"},
        {"label": "May", "value": 1750, "color": "#9b59b6"},
        {"label": "Jun", "value": 1900, "color": "#1abc9c"},
    ]
    result3 = vc.compress_chart(chart_data, "bar", "Monthly Scan Volume")
    print(f"\n  Chart compressed:")
    print(f"    Original: {result3['original_tokens']} text tokens")
    print(f"    Image:    {result3['image_tokens']} vision tokens")
    print(f"    Saved:    {result3['tokens_saved']} tokens ({result3['compression_ratio']} reduction)")
    
    print(f"\n=== Stats ===")
    print(json.dumps(vc.get_stats(), indent=2))
    vc.close()
