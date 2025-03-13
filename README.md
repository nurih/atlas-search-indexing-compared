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
