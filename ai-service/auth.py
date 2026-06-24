import os
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

API_KEY = os.getenv("AI_SERVICE_API_KEY", "")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify API key from Express server. Skip if no key is configured."""
    if not API_KEY:
        return True
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True
