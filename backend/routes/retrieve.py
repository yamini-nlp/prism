from fastapi import APIRouter, Query, Request, Depends, Header
from fastapi.responses import JSONResponse
from core.embedder import hybrid_search
from core.auth import verify_api_key
from core.limiter import limiter

router = APIRouter(dependencies=[Depends(verify_api_key)])

@router.get("/")
@limiter.limit("60/minute")
async def retrieve(
    request: Request,
    query: str = Query(..., description="Search query"),
    top_k: int = Query(5, ge=1, le=20, description="Number of chunks to retrieve"),
    x_session_id: str = Header(...),
):
    results = hybrid_search(query, x_session_id, top_k=top_k)

    return JSONResponse({
        "query": query,
        "top_k": top_k,
        "results": results,
        "count": len(results),
    })