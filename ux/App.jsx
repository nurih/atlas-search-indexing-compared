import { useState } from "react";
import WordList from "./WordList";
import VectorVisualizer from "./VectorVisualizer";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  AppBar,
  Toolbar
} from "@mui/material";
import AbcIcon from "@mui/icons-material/Abc";
import SearchIcon from "@mui/icons-material/Search";

const API_BASE_URL = `${document.location.href}api`;

const BookCard = ({ book, onViewWords }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="h6" component="div" gutterBottom>
        {book.title}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 1
        }}
      >
        <Typography variant="body1" color="primary" sx={{ fontWeight: "bold" }}>
          Score: {book.score.toFixed(4)}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            color: "text.secondary"
          }}
        >
          ID: {book._id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          | {book.year} • {book.pages} pages
        </Typography>
      </Box>

      <Box sx={{ textAlign: "end", contentAlign: "end" }}>
        <Button variant="contained" onClick={() => onViewWords(book._id)}>
          
          <AbcIcon />...
        </Button>
      </Box>
    </CardContent>
  </Card>
);

const ResultsColumn = ({ title, books, loading, error, onViewWords }) => (
  <Box>
    <Typography
      variant="h4"
      component="h2"
      gutterBottom
      align="center"
      sx={{ mb: 2 }}
    >
      {title}
    </Typography>

    {loading && (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    )}
    {error && (
      <Typography color="error" align="center">
        {error}
      </Typography>
    )}
    {!loading &&
      !error &&
      books.map((book) => <BookCard book={book} onViewWords={onViewWords} />)}
  </Box>
);

const App = () => {
  const [query, setQuery] = useState("story about the ogre");
  const [vectorResults, setVectorResults] = useState([]);
  const [textResults, setTextResults] = useState([]);
  const [loading, setLoading] = useState({ vector: false, text: false });
  const [error, setError] = useState({ vector: null, text: null });
  const [showWordList, setShowWordList] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [bookIds, setBookIds] = useState([]);

  const handleSearch = async () => {
    if (!query) return;

    // Reset states
    setLoading({ vector: true, text: true });
    setError({ vector: null, text: null });
    setVectorResults([]);
    setTextResults([]);
    setBookIds([])

    // Vector Search
    try {
      const vectorResponse = await axios.get(`${API_BASE_URL}/search`, {
        params: { query, engine: "vector" }
      });
      const books = vectorResponse.data.books;
      setVectorResults(books);
      const bookIds = books.map((e) => e._id);
      console.log("Book id list", bookIds.join(", "));
      setBookIds(bookIds);
    } catch (err) {
      setError((prev) => ({
        ...prev,
        vector: "Failed to fetch vector results."
      }));
      console.error("Vector Search Error:", err);
    } finally {
      setLoading((prev) => ({ ...prev, vector: false }));
    }

    // Text Search
    try {
      const textResponse = await axios.get(`${API_BASE_URL}/search`, {
        params: { query, engine: "text" }
      });
      setTextResults(textResponse.data.books);
    } catch (err) {
      setError((prev) => ({ ...prev, text: "Failed to fetch text results." }));
      console.error("Text Search Error:", err);
    } finally {
      setLoading((prev) => ({ ...prev, text: false }));
    }
  };

  const handleOpenWordList = (id) => {
    setSelectedBookId(id);
    setShowWordList(true);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
    setBookIds([])
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Comparison between Vector Text Index Search
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            label="Search for a book"
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading.vector || loading.text}
            sx={{ whiteSpace: "nowrap" }}
          >
            <SearchIcon />
          </Button>
        </Box>
        <Box>
          {bookIds?.length ? (
            <VectorVisualizer query={query} bookIds={bookIds} />
          ) : (
            <></>
          )}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            alignItems: "flex-start"
          }}
        >
          <ResultsColumn
            title="Vector Search"
            books={vectorResults}
            loading={loading.vector}
            error={error.vector}
            onViewWords={handleOpenWordList}
          />
          <ResultsColumn
            title="Text Search"
            books={textResults}
            loading={loading.text}
            error={error.text}
            onViewWords={handleOpenWordList}
          />
        </Box>
        <WordList
          open={showWordList}
          bookId={selectedBookId}
          query={query}
          onClose={() => setShowWordList(false)}
        />
      </Container>
    </>
  );
};

export default App;
