import os
from fastapi import FastAPI, Query
from pymongo import MongoClient
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from typing import List, Literal
from get_words import get_words 
# --- Constants from vector_vs_text_search.py ---
MONGODB_URI = os.environ.get("MONGO_URL")
DB_NAME = "mongodb_genai_devday_vs"
COLLECTION_NAME = "book"
VECTOR_SEARCH_INDEX_NAME = "vector_index"
TEXT_SEARCH_INDEX_NAME = "full_text_index_book"
EMBEDDING_FIELD = "embedding"

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Book Search API",
    description="An API to search for books using vector or text search.",
)


# --- Models ---


class Book(BaseModel):
    id: str = Field(..., alias="_id")
    score: float
    title: str
    year: int
    pages: int


class SearchResult(BaseModel):
    engine: Literal["text", "vector"]
    query: str
    books: List[Book]


# --- Global Resources ---
mongodb_client = MongoClient(MONGODB_URI)
book_collection = mongodb_client[DB_NAME][COLLECTION_NAME]
book_chunks_collection = mongodb_client[DB_NAME][COLLECTION_NAME + "_chunks"]

embedding_model = SentenceTransformer("thenlper/gte-base")


# --- Search Functions (adapted from vector_vs_text_search.py) ---
def vector_search(user_query: str, filter={}) -> List[Book]:

    query_vector = embedding_model.encode(user_query).tolist()

    pipeline = [
        {
            "$vectorSearch": {
                "index": VECTOR_SEARCH_INDEX_NAME,
                "path": EMBEDDING_FIELD,
                "filter": filter,
                "queryVector": query_vector,
                "numCandidates": 50,
                "limit": 6,
            }
        },
        {
            "$project": {
                "_id": 1,
                "title": 1,
                "year": 1,
                "pages": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]

    return book_chunks_collection.aggregate(pipeline).to_list()


def text_search(user_query: str) -> List[Book]:
    pipeline = [
        {
            "$search": {
                "index": TEXT_SEARCH_INDEX_NAME,
                "text": {"query": user_query, "path": {"wildcard": "*"}},
            }
        },
        {"$addFields": {"score": {"$meta": "searchScore"}}},
        {"$limit": 6},
        {
            "$project": {
                "_id": 1,
                "title": 1,
                "year": 1,
                "pages": 1,
                "score": 1,
            }
        },
    ]

    return book_collection.aggregate(pipeline).to_list()


# --- API Endpoint ---
@app.get("/search", response_model=SearchResult)
def search_books(
    query: str,
    engine: Literal["text", "vector"] = Query(
        "vector", description="The search engine to use."
    ),
):
    """
    Searches for books using the specified query and search engine.

    - **query**: The search term.
    - **engine**: The search engine to use ('vector' or 'text').
    """
    results = vector_search(query) if engine == "vector" else text_search(query)

    return {"engine": engine, "query": query, "books": results}


@app.get("/book/{id}/words")
def get_book_words(id: str) -> list[str]:
    doc = book_collection.find_one({"_id": id}, {"title": 1, "synopsis": 1})
    return [w for w in get_words(doc, "title", "synopsis")]

    return


@app.get("/book/{id}")
def get_book(id: str) -> dict:
    return book_collection.find_one({"_id": id})


@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Book Search API. Go to /docs to see the API documentation.",
        "link": "/docs",
    }
