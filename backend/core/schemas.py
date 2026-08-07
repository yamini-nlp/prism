from pydantic import BaseModel, ConfigDict


class JobAcceptedResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    job_id: str


class TextIngestRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    source: str = "Manual Input"


class URLIngestRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    url: str


class RetrievedChunk(BaseModel):
    model_config = ConfigDict(strict=True)

    chunk: str
    source: str
    score: float
    chunk_index: int


class RetrieveResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    query: str
    top_k: int
    results: list[RetrievedChunk]
    count: int


class GenerateRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    query: str
    top_k: int = 5
    model: str = "llama-3.3-70b-versatile"


class SummaryRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    source: str = "Document"


class SummaryResult(BaseModel):
    model_config = ConfigDict(strict=True)

    tldr: str
    key_concepts: list[str]
    methodology: str
    results: str
    limitations: str


class SummaryResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    source: str
    summary: SummaryResult


class VerifyRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    answer: str
    context_chunks: list[str]


class ClaimResult(BaseModel):
    model_config = ConfigDict(extra="allow")

    claim: str
    label: str
    confidence: float = 0.0
    supporting_chunk: str | None = None
    source_chunk_index: int | None = None


class VerifyResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    claims: list[ClaimResult]
    total_claims: int
    supported_count: int
    unsupported_count: int
    uncertain_count: int = 0
    grounding_score: float