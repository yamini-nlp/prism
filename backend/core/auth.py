import os
from typing import Optional
from fastapi import Header, HTTPException

def verify_api_key(x_api_key: Optional[str] = Header(default=None)):
    expected = os.getenv("APP_API_KEY")
    if not expected or not x_api_key or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")