"""
ai-engine/embedding.py — Generate and store 384-dimensional vector embeddings in Supabase legal_chunks.
Follows Step 12 of the Supabase pgvector integration guide.
"""

import os
import sys
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️  Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment.")
    print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.")
    sys.exit(0)

# Connect to Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load multilingual 384-dimension embedding model
print("⏳ Loading embedding model sentence-transformers/all-MiniLM-L6-v2 (384-dim)...")
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Sample verified statutory texts to embed
LEGAL_CHUNKS_DATA = [
    {
        "content": "Workers have legal protections relating to wages. An employee may have remedies when wages are not paid according to applicable law under Payment of Wages Act 1936.",
        "language": "en",
        "source_url": "https://www.indiacode.nic.in/handle/123456789/2367",
        "chunk_number": 1,
    },
    {
        "content": "Under Section 5 of the Payment of Wages Act 1936, wages must be disbursed on or before the 7th or 10th of every month. Delayed wages allow claims under Section 15 with compensation up to ten times the withheld amount.",
        "language": "en",
        "source_url": "https://www.indiacode.nic.in/handle/123456789/2367",
        "chunk_number": 2,
    },
    {
        "content": "Under Section 3 and Section 12 of the Protection of Women from Domestic Violence Act 2005, physical, emotional, economic, and verbal abuse is prohibited. Women can seek emergency Protection Orders from the Magistrate.",
        "language": "en",
        "source_url": "https://www.indiacode.nic.in/handle/123456789/2021",
        "chunk_number": 1,
    },
    {
        "content": "Under the Consumer Protection Act 2019, any citizen who purchases defective goods or receives deficient service can file a grievance online on e-Daakhil (edaakhil.nic.in) or call 1915.",
        "language": "en",
        "source_url": "https://www.indiacode.nic.in/handle/123456789/15256",
        "chunk_number": 1,
    },
]

def main():
    print("🚀 Generating embeddings and saving into Supabase legal_chunks...")

    for item in LEGAL_CHUNKS_DATA:
        # Generate 384-dim normalized vector
        embedding = model.encode(item["content"], normalize_embeddings=True).tolist()
        
        # Insert into Supabase table
        response = supabase.table("legal_chunks").insert({
            "content": item["content"],
            "chunk_number": item["chunk_number"],
            "language": item["language"],
            "source_url": item["source_url"],
            "embedding": embedding,
        }).execute()
        
        print(f"✅ Saved chunk: '{item['content'][:60]}...' (Vector dim: {len(embedding)})")

    print("\n🎉 Embeddings successfully generated and stored in Supabase pgvector!")

if __name__ == "__main__":
    main()
