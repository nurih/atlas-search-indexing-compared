# R&D Comparing Vector and Text Search

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
