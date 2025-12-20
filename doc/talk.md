---
marp: true
footer: © Nuri Halperin, 2025
theme: gaia
style: |
  :root {
    --color-background: #faffff;
    --color-foreground: #444;
    --font-main:sans-serif;
    font-size: 2rem;
  }
  section{
    font-family: "Lucida Sans" ;
  }
  h1,h2,h3 {
    font-family: "Cooper Black", serif;
    font-weight: bold;
    margin-top: 0.3em;
    margin-bottom: 0.5em;
  }
  h3{ 
    font-size: 2.0rem;
  }
  .myColumns {
    display: flex;
    justify-content: space-between;
  }
  .myColumn {
    width: 48%;
  }
  footer {
    border-top: solid 1px;
    font-size: .3em;
  }
---

# Is Vector Search Right for Me?

> A talk about Vector Search,

---

## Search Overview

![ contain](./search_history_0.svg)

---

## Caveman Era I

![height:530](./search_history_1.svg)

---

## Caveman Era II

![height:530](./search_history_2.svg)

---

## Enlightment I

![height:530](./search_history_3.svg)

---

## Enlightment II

![height:530](./search_history_4.svg)

---

## Enlightment III

![height:530](./search_history_5.svg)

---

## Index

> Avoids **scanning** for results.
> Direct **pre-indexed** pointers.

![bg right width:360](scan-data.jpg)
![bg right:60% width:360](binary-tree.png)

---

## Token Era + Index

1. Prepare:
    1. Split documents to tokens (words)
    1. Create index `token` -> `documnet`s
1. Use:
    1. Split query into `token`s
    1. Find documents using `index`
    1. Rank results by those that contain the most tokens <sup>*</sup>

---

## Token Issues

1. "I saw a dead <span style="font-size:2em;">:mouse:</span>"
1. "My <span style="font-size:2em;">:computer_mouse:</span> died."

![bg left height:480](they-are-the-same.jpg)

---

## Vector

- Set of points along N-axis
- Distance between points indicates similarity
- N-Dimensional

![height:460px bg left](2d-space.svg)

---

## Embedding

![yo](embedding-process.svg)

* The `Embedding Model` does the heavy lifting.
* It is trained (or programmed) to project documents with similar semantic meaning into the same spatial region, and dissimilar ones far apart.

---

## Searching

![yo](vector-search.svg)

At runtime, user **query** is converter to a `vector` that is searched against a `vector index` (database) which then retrieves the semantically similar documents.

---

## Equality & Likeness

Scalar comparison

|Operation| Example | Meaning|
|---|---|---|
|`=`| 2 `=` 2 | Are two values equal|
|`>` / `<` | 2 `>` 1 and 2 `<` 4 | Values in a range|

But what about **vector** comparison?

Is `[1,2]`, `[1,1]`, `[2,1]` equal? in some range? How?

---

## Vector Nearness

### TL;DR
>
> Math!

### Numerical methods

1. Euclidean: $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$
1. Cosine: $d = \frac{x_1 x_2 + y_1 y_2}{\sqrt{x_1^2 + y_1^2} \, \sqrt{x_2^2 + y_2^2}}$
1. Dot Product: $d = x_1 x_2 + y_1 y_2$

---

```mermaid
---
config:
  theme: neo
---
timeline
    title A Coarse History of Search 2
    Section Caveman
      Stringy
        : "I know the Id"
        : grep
        : find .
      SQLish
        : like '%foo%'
        : soundex(foo)
        : SUBSTR / LEFT / RIGHT
    Section Smartiepants
      Token
        %% : Lucene / Solr / Elastic
        %% : Stemming / Linguistics
        %% : Scoring / Tuning
      Vector
        %% : Vector Index
      Gambler 
        %% : Annoying summary that takes time and is wildly inaccurate
```

```mermaid
quadrantChart
    title Two Dimensional Space
    y-axis Few Buttons --> Many Buttons
    x-axis Smaller --> Larger
    %% quadrant-1 Big With Buttons
    House Mouse: [0.10, 0.05]
    Rat 1: [0.42, 0.10]
    Micky Mouse: [0.72, 0.22]
    Computer Mouse: [0.52, 0.44]
    Graphics Mouse: [0.54, 0.84]

```

---

```mermaid

flowchart LR
    A@{ shape: doc, label: "Document" }
    T@{ shape: subproc, label: "Embedding Model" }
    V@{ shape: braces, label: "[ 0.12, 0.87, 0.34, 0.56, 0.09, 0.73, 0.41, 0.68, 0.25, 0.97, 0.03 ]" }
    A -- chunking --> T
    T -- create vector --> V

```

```mermaid
flowchart LR
    Q@{ shape: div-rect, label: "Query" }
    T@{ shape: subproc, label: "Embeddin" }
    V@{ shape: braces, label: "[ 0.68, 0.97, 0.03... ]" }
    DB@{shape: database, label: "Vector Index" }
    DOC@{ shape: documents, label: "Results"}
    Q --> T
    T --> V
    V -- Search --> DB
    DB --> DOC
```

## Outline

- C'est Ci Nest pas un Sales Pitch
- Covered:

  - What is Vector Search
    - From Text to Vector
      - Embedding
      - Your Own?
        - Train
        - Handmade
      - Vector Index
        - HNSW
        - D
  - Vector Comparison
    - How does it differ from token match?
    - How Token match works<sup>*</sup>
    - Examp
  - What to expect
  - What it doesn't do
  - Mechanisms in the wild
