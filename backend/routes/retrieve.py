from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from core.embedder import search

router = APIRouter()

@router.get("/")
async def retrieve(
    query: str = Query(..., description="Search query"),
    top_k: int = Query(5, ge=1, le=20, description="Number of chunks to retrieve"),
):
    results = search(query, top_k=top_k)

    return JSONResponse({
        "query": query,
        "top_k": top_k,
        "results": results,
        "count": len(results),
    })