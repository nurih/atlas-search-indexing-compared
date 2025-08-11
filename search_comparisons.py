# %%
import ast
import kagglehub
import pandas as pd
import os
from langchain_huggingface import HuggingFaceEmbeddings

from pymongo import MongoClient

# %%
# Download latest version
dataset_dir = kagglehub.dataset_download("joebeachcapital/restaurant-reviews")

print("Path to dataset files:", dataset_dir)

# %%
# Load
original_csv = f"{dataset_dir}\\Restaurant reviews.csv"

df = pd.read_csv(original_csv)

ready_data_file = f"{dataset_dir}\\reviews_with_embeddings.csv"

# %%
# Prep
## Combine columns to end up with 1 column with all the text to index, for simplicity
df["Text"] = df.apply(
    lambda r: f"{r['Restaurant']}\n{r['Time']}\n\n{r['Review']}", axis=1
)

df = df[["Restaurant", "Reviewer", "Rating", "Time", "Text"]]
df["_id"] = df.index

df.dropna(inplace=True)

df.info()

# %%
# Embeddings model

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

print("Embedding length", len(embeddings.embed_query("Hello, world!")))

# %%
EMBEDDING_FIELD_NAME = "_vect"

# Add Embedding
if os.path.exists(ready_data_file):
    print("Found existing dataset with embeddings.", ready_data_file)
    df = pd.read_csv(ready_data_file)
    df._vect = df._vect.apply(ast.literal_eval)
else:
    df[EMBEDDING_FIELD_NAME] = embeddings.embed_documents(df.Text)
    # Save to local file
    print("Saving dataset with embeddings locally.", ready_data_file)
    df.to_csv(ready_data_file)

df.describe()


# %%

# MongoDB
COLLECTION_NAME = "reviews_for_search_comparison"

client = MongoClient(os.environ.get("MONGO_URL"))
db = client.get_default_database()
DB_NAME = db.name
collection = db[COLLECTION_NAME]


def batch_upload_to_mongo(dataframe, batch_size=512):
    total_rows = len(dataframe)
    for offset in range(0, total_rows, batch_size):
        end = min(offset + batch_size, total_rows)
        batch = dataframe.iloc[offset:end].to_dict(orient="records")
        collection.insert_many(batch, ordered=False, comment="Upload of review data")
        print(f"Uploaded rows {offset} to {end-1}")


# %%
# Define text search index
from pymongo.operations import SearchIndexModel

TEXT_INDEX_NAME = f"{DB_NAME}_{COLLECTION_NAME}_Text"

text_index_definition = SearchIndexModel(
    {"mappings": {"dynamic": False, "fields": {"Text": {"type": "string"}}}},
    name=TEXT_INDEX_NAME,
)

text_index_definition


# %%
# Define vector index

EMBEDDING_DIMENSIONS = 768  # must match on the embedding model dimensions!
SIMILARITY = "cosine"
VECTOR_INDEX_NAME = f"{DB_NAME}_{COLLECTION_NAME}_Vector"

vector_index_definition = SearchIndexModel(
    definition={
        "fields": [
            {
                "type": "vector",
                "numDimensions": EMBEDDING_DIMENSIONS,
                "path": EMBEDDING_FIELD_NAME,
                "similarity": SIMILARITY,
            },
            {"path": "Rating", "type": "filter"},
        ]
    },
    name=VECTOR_INDEX_NAME,
    type="vectorSearch",
)

vector_index_definition

# %%
# Index Creation
existing_indecies = [i["name"] for i in collection.list_search_indexes().to_list()]


if not VECTOR_INDEX_NAME in existing_indecies:
    collection.create_search_index(vector_index_definition)
else:
    print(f"{VECTOR_INDEX_NAME} already exists")

if not TEXT_INDEX_NAME in existing_indecies:
    collection.create_search_index(text_index_definition)
else:
    print(f"{TEXT_INDEX_NAME} already exists")

# %%
# Upload documents (If index defined, then it will be updated with new document data)
if len(df) == collection.count_documents({}):
    print(
        "No-op: The collection has documents already. Manually delete docs to re-upload."
    )
    # collection.delete_many({})
else:
    batch_upload_to_mongo(df)


# %%
# Run text query both ways

query_text = "Good falafel joint"

# Query and cross compare
query_vector = embeddings.embed_query(query_text)
l = {"$limit": 3}


vq = {
    "$vectorSearch": {
        "index": VECTOR_INDEX_NAME,
        "path": EMBEDDING_FIELD_NAME,
        "queryVector": query_vector,
        "numCandidates": 100,
        "limit": l["$limit"],
    }
}


tq = {
    "$search": {
        "index": TEXT_INDEX_NAME,
        "text": {"query": query_text, "path": "Text"},
        "scoreDetails": True,
    },
}


vector_results = collection.aggregate(
    [
        vq,
        {
            "$project": {
                EMBEDDING_FIELD_NAME: 0,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
        l,
    ]
).to_list()

text_results = collection.aggregate(
    [tq, {"$project": {EMBEDDING_FIELD_NAME: 0, "score": {"$meta": "searchScore"}}}, l]
).to_list()

print(">>> Query: ", query_text)


def show(method, d):
    print(f"\n\n*** {method} ***")
    print("Score:", d.get("score", None))
    print(d["Text"])


for i in range(l["$limit"]):
    show("Vector", vector_results[i])
    show("Text", text_results[i])


# %%

