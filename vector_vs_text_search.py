# %%
import os
from pymongo import MongoClient
from pymongo.errors import OperationFailure
import json
from tqdm import tqdm
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

# %%
MONGODB_URI = os.environ.get("MONGO_URL")
DB_NAME = "mongodb_genai_devday_vs"
COLLECTION_NAME = "book"
VECTOR_SEARCH_INDEX_NAME = "vector_index"
TEXT_SEARCH_INDEX_NAME = "full_text_index_book"
EMBEDDING_FIELD = "embedding"

# %%
mongodb_client = MongoClient(MONGODB_URI)
mongodb_client.list_database_names()

book_collection = mongodb_client[DB_NAME][COLLECTION_NAME]
book_chunks_collection = mongodb_client[DB_NAME][COLLECTION_NAME + "_chunks"]
book_collection.full_name, book_chunks_collection.full_name


try:
    book_chunks_collection.drop_search_index(VECTOR_SEARCH_INDEX_NAME)
except OperationFailure as e:
    if not e.code == 27:  # index not found
        raise

try:
    book_collection.drop_search_index(TEXT_SEARCH_INDEX_NAME)
except OperationFailure as e:  # index not found
    if not e.code == 27:
        raise

# %%
with open("./books.json", "r") as fp:
    data = json.load(fp)

print(f"Deleting existing documents from {book_collection.full_name}.")
book_collection.delete_many({})

book_collection.insert_many(data)
print(f"{COLLECTION_NAME} now has {book_collection.count_documents({})} docs.")

# %%
separators = ["\n\n", "\n", " ", "#", "##", "###", "<", ">", "/>", "</", ".", ";"]

text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    model_name="gpt-4", separators=separators, chunk_size=200, chunk_overlap=30
)


def split(doc: dict, fields: list[str]) -> list[dict]:
    combined_fields = "\n\n".join([doc[f] for f in fields])
    texts = text_splitter.split_text(combined_fields)

    chunked_docs = [to_chunk_doc(doc, txt, offset) for offset, txt in enumerate(texts)]
    return chunked_docs


def to_chunk_doc(doc, txt, offset):
    result = doc.copy()
    result["_chunk"] = txt
    result["_id"] = f"{doc['_id']}_{offset}"
    return result


# %%
embedding_model = SentenceTransformer("thenlper/gte-base")


def create_chunk_doc_with_embedding(doc: dict) -> dict:

    vector = embedding_model.encode(doc["_chunk"], max_position_embedding=512).tolist()

    doc[EMBEDDING_FIELD] = vector
    return doc


# %%
# Split docs into chunk documents. Each doc has chunk instead of full synopsis
original_docs = book_collection.find({}).to_list()
chunked_docs = []
for doc in original_docs:
    chunked_docs.extend(split(doc, ["title", "synopsis"]))

print(f"{len(original_docs)} docs became {len(chunked_docs)} chunks")

# %%
# Create embedding for each chunk - takes time
# remove any pre-existing docs
book_chunks_collection.delete_many({})

for doc in tqdm(chunked_docs, "Creating embeddings for chunks and uploading."):
    doc_with_embedding = create_chunk_doc_with_embedding(doc)
    book_chunks_collection.insert_one(doc_with_embedding)

# %%

book_chunks_collection.create_search_index(
    {
        "name": VECTOR_SEARCH_INDEX_NAME,
        "type": "vectorSearch",
        "definition": {
            "fields": [
                {
                    "type": "vector",
                    "path": EMBEDDING_FIELD,
                    "numDimensions": embedding_model.get_sentence_embedding_dimension(),
                    "similarity": "cosine",
                    # "quantization":"scalar",
                },
                {"type": "filter", "path": "year"},
                {"type": "filter", "path": "pages"},
            ]
        },
    }
)


# %%
def vector_search(user_query: str, filter: dict | None = {}) -> None:

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

    results = book_chunks_collection.aggregate(pipeline)

    print("### VECTOR INDEX SEARCH RESULTS ###")
    print(f"$?: `{user_query}`")
    for book in results:

        print(
            f"{round(book['score'],6)}: {book['_id']} {book['title']} ({book['year']}, {book['pages']}pp)"
        )

    print("")


# %%
vector_search("pet", {"year": 2001})
vector_search("pet", {"pages": {"$lt": 121}})

# %%
# "traditional" text index
book_collection.create_search_index(
    {
        "name": TEXT_SEARCH_INDEX_NAME,
        "type": "search",
        "definition": {
            "mappings": {
                "dynamic": False,
                "fields": {"title": {"type": "string"}, "synopsis": {"type": "string"}},
            }
        },
    }
)


# %%
def search_text_index(user_query: str):
    pipeline = [
        {
            "$search": {
                "index": TEXT_SEARCH_INDEX_NAME,
                "text": {
                    "query": user_query,
                    "path": {"wildcard": "*"},
                    # ["title", "synopsis"]
                },
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

    results = book_collection.aggregate(pipeline)
    print("### TEXT INDEX SEARCH RESULTS ###")
    print(f"$?: `{user_query}`")

    for book in results:
        print(
            f"{round(book['score'],6)}: {book['_id']} {book['title']} ({book['year']}, {book['pages']}pp)"
        )

    print("")


# %%
query = "pet"
vector_search(query)
search_text_index(query)


# %%
# This shows that in text indexing, token match is basic - exact match unless sinonym / stemming / dictionaries are configured.

from get_words import get_words

HAS_PET_WORD = "0452281741"
MISSING_PET_WORD = "0941807304"

def show_tokens(id):
    doc = book_collection.find_one({"_id": id}, {"title": 1, "synopsis": 1})
    print(id, doc["title"],'\n', [w for w in get_words(doc, "title", "synopsis") if w.startswith("p")])
    


show_tokens( HAS_PET_WORD)
print('\n********')
show_tokens( MISSING_PET_WORD)

