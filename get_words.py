import re
def get_words(doc, *fields):
    txt = " ".join(str(doc[field]) for field in fields)
    words = re.split(r"\W", txt.lower())
    unique_words = sorted(set(words), key=str.lower)
    return unique_words