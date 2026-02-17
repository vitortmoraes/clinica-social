
import json
import sys
import os

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

def generate_openapi():
    print("Generating OpenAPI schema...")
    openapi_schema = app.openapi()
    
    output_path = "openapi.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
    
    print(f"OpenAPI schema saved to {output_path}")

if __name__ == "__main__":
    generate_openapi()
