---
marp: true
footer: © Nuri Halperin, 2025
theme: gaia
style: |
  :root {
    --color-background: #fdfefd;
    --color-foreground: #444;
    --font-main:sans-serif;
    font-size: 1.8rem;
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
  img {
    border: dotted 1px magenta
  }
  
---

# Is Vector Search Right for Me?

<hr/>

> A talk about Vector Search

---

## Outline

* What is Vector Search
  * From Text to Vector
    * Embedding
    * Your Own? Train / Algorithm
    * Vector Index: HNSW / IVF
* Vector Comparison
  * How does it differ from token match?
  * Demo / code review?
* What it doesn't do  

---

## Search Overview

![ contain](./search_history_0.svg)

---

## Caveman Era I

![height:480](./search_history_1.svg)

---

## Caveman Era II

![height:480](./search_history_2.svg)

---

## Enlightment I

![height:480](./search_history_3.svg)

---

## Enlightment II

![height:480](./search_history_4.svg)

---

## Enlightment III

![height:480](./search_history_5.svg)

---

## Index

> Avoids **scanning** for results.
> Direct **pre-indexed** pointers.

![bg right width:360](scan-data.jpg)
![bg right:60% width:360](binary-tree.png)

---

## Token Era + Index

* ### Prepare

    1. Split documents to tokens (words)
    1. Create index: `token` ⇒ `documnet`s

* ### Use

    1. Split query into `token`s
    1. Find documents using `index`
    1. Rank results by those that contain the most tokens <sup>*</sup>

---

## Token Match Example

Consider the query "Great dog show":

|Corpus|Match|
|---|---|
|The Westminster `dog` `show`|✅✅|
|The movie "Best in `show`" was `great`!|✅✅|
|The `Great` British Bake Off|✅|
|Nathen's Hot `Dog` Eating Contest is awesome!|✅|
|Canadian Kennel Club National Championship|❌|

---

## Token Issues

1. "I saw a dead <span style="font-size:2em;">:mouse:</span>"
1. "My <span style="font-size:2em;">:computer_mouse:</span> died."

![bg left height:480](they-are-the-same.jpg)

---

## Vector

- List of values along N-axis `[0.2,0.9,0.1,...]`
- Distance between points indicates similarity
- N-Dimensional

![height:460px bg left](2d-space.svg)

---

## Embedding

> A fingerprint for the document :magic_wand: 👍️ :printer:

![yo](embedding-process.svg)

* The `Embedding Model` does the heavy lifting.
* It is trained (or programmed) to project documents with similar semantic meaning into the same spatial region, and dissimilar ones far apart.

---

## Searching

![yo](vector-search.svg)

User `query` is converter into a `vector` that is searched against a `vector index`<sup>1</sup> which then retrieves the semantically similar documents <sup>2</sup>.

* _<sup>1</sup> Database or pure index_
* _<sup>2</sup> Document or pointer to document_

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

**TL;DR** : "It's Math!"

|Method| Formula|
|---|---|
|Euclidean| $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$|
|Cosine| $d = \frac{x_1 x_2 + y_1 y_2}{\sqrt{x_1^2 + y_1^2} \, \sqrt{x_2^2 + y_2^2}}$|
|Dot Product<sup>*</sup>| $d = x_1 x_2 + y_1 y_2$|

<sup>*</sup> Dot product is not similarity measure

---

## Vector Index

> Traversable layers of vector groupings

* Drill from coarse to granular.
* Reduces runtime compute to a small subset of vector comparisons.

(**H**ierarchical **N**avigable **S**mall **W**orld)

![bg right:42%](./vector_hierarchy.png)

---

## Demo

A side by side search of text and vector indecies

![bg left height:640](demo_flow.svg)

---

## Maybe Not?

* Result Control
  * Few "Knobs to turn"
    * Chunking (How you feed it)
    * Embedding model (What it produces)
  * Reranking

* Cost

  * Model training cost / rent
  * Embedding speed
  * Re-Ranking

![bg left:30% height:200](weary_cat.svg)

---

## Thanks

### By

linkedin/ @nurih | 818.446.NUHA

### Demo Dataset

`SentenceTransformer("thenlper/gte-base")`, Book dataset adapted from MongoDB Developer Days workshop

### Slides

 `marp`
