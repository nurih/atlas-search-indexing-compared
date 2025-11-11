# R&D Comparing Vector and Text Search

## Description

This project showcases the difference between "traditional" text search index and vector search on the same text. By running the same query against 2 different indexes, one can inspect and learn which results are returned and evaluate which index performs better for that type of query.

```mermaid
---
config:
  theme: redux
  look: handDrawn
---
flowchart TD
    M@{ shape: cyl, label: "MongoDB Atlas" }
    IV@{shape: lin-doc, label: "Vector Index"}
    IT@{shape: lin-doc, label: "Text Index"}
    E@{ shape: lin-rect, label: "Embedding Model" }
    D@{ shape: docs, label: "Doc + Embedding" }
    QR@{ shape: docs, label: "Query Results" }
    Q@{ shape: flag, label: "Create Queris" }
    VQ@{ shape: braces, label: "Vector Query" }
    TQ@{ shape: braces, label: "Text Query" }
    pp[/Data Load/] --> E
    E --> D
    D --> M
    IV --> M
    IT--> M
    Q --> VQ
    Q --> TQ
    TQ --> IT
    VQ --> IV
    M --> QR
    QR --> qe((Display))
    qs((Ask)) --> Q
```

## UX Oriented

> This assumes that you already have the MongoDB Atlas data and indecies set up (see next section).

A web page performing search against both vector and text indecies. This section showcases the differences from the end-user perspective.

Compile the React web app, resulting in artifacts in the [ux/dist directory](ux/dist).

```shell
cd ux
bun install
bun run build
```

Start the API and web server.

```shell
# install dependencies
uv sync
# run the project
uv run uvicorn app:app
```

Navigate to the web interface, and submit a query.

- Web interface at <http://localhost:8000/>
- Swagger web interface at <http://localhost:8000/docs>

> The application loads the sentence stransformer and embedding model, which may take some time at startup.
> This can cause the web interface to time out. Let the app fully load for a bit and try again. Once loaded, 
> there should not be noticable sluggishness.

## Code Oriented

This script can details the creation of the collection, data preparation, staging into MongoDB, index creation, and querying.

## Run

Set up an environment:

```shell
uv venv
./.venv/Scripts/Activate       
uv sync
```

You will need a MongoDB Atlas connection. Set the environment variable `MONGO_URL` to the connection string, which looks like `mongodb+srv://USER:PWD@cluster0.crqyi.mongodb.net/demo` (replace `USER`, `PWD` with your database username and password, and `demo` with whatever database name you want).

1. Open [/search_comparisons.py](/search_comparisons.py) in VS Code.
1. Run cells

> Note: Initial buildout of the embeddings may take significant time.

The process of creating embeddings on 10K pieces of text takes time. Choices of embedding model and infrastructure to run them can affect this greatly.

Depending on the embedding generation, it was sometimes necessary to apply `df._vect = df._vect.apply(ast.literal_eval)` to the dataframe loaded from disk, in order for `to_dict('records')` to represent the contend of the `_vect` field as an array instead of a quote string containing a JSON like array. This can cost extra 10s of seconds.
