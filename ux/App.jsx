import { useState } from "react";
import WordList from "./WordList";
import VectorVisualizer from "./VectorVisualizer";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  AppBar,
  Toolbar
} from "@mui/material";

const API_BASE_URL = `${document.location.href}api`;

const BookCard = ({ book, onViewWords }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="h6" component="div" gutterBottom>
        {book.title}
      </Typography>
      <Typography sx={{ mb: 1.5 }} color="text.secondary">
        {book.year} • {book.pages} pages
      </Typography>
      <Typography variant="body2" color="primary">
        Score: {book.score.toFixed(4)}
      </Typography>
      <Typography variant="body1" align="left">
        _id: {book._id}
      </Typography>
      <Button
        variant="contained"
        color="info"
        onClick={() => onViewWords(book._id)}
        align="right"
      >
        View Words
      </Button>
    </CardContent>
  </Card>
);

const ResultsColumn = ({ title, books, loading, error, onViewWords }) => (
  <Box>
    <Typography variant="h4" component="h2" gutterBottom align="center">
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
    {!loading && !error && (
      <Grid container spacing={2}>
        {books.map((book) => (
          <Grid item xs={12} key={`${title}-${book._id}`}>
            <BookCard book={book} onViewWords={onViewWords} />
          </Grid>
        ))}
      </Grid>
    )}
  </Box>
);

const App = () => {
  const [query, setQuery] = useState("a pet");
  const [vectorResults, setVectorResults] = useState([]);
  const [textResults, setTextResults] = useState([]);
  const [loading, setLoading] = useState({ vector: false, text: false });
  const [error, setError] = useState({ vector: null, text: null });
  const [showWordList, setShowWordList] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [bookIds, setBookIds] = useState([]);
  const [showVectors, setShowVectors] = useState(false);

  const handleSearch = async () => {
    if (!query) return;

    // Reset states
    setLoading({ vector: true, text: true });
    setError({ vector: null, text: null });
    setVectorResults([]);
    setTextResults([]);

    // Vector Search
    try {
      const vectorResponse = await axios.get(`${API_BASE_URL}/search`, {
        params: { query, engine: "vector" }
      });
      setVectorResults(vectorResponse.data.books);
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

  const handleShowVectors = () => {
    const bookIds = vectorResults.map((e) => e._id);
    console.log("Book ids", bookIds);
    setBookIds(bookIds);
    setShowVectors(true);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Book Search: Vector vs. Text
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
            Search
          </Button>
          {vectorResults?.length? (
            <Button
              onClick={handleShowVectors}
              variant="outlined"
              color="success"
            >
              Vector 2D
            </Button>
          ):(<></>)}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <ResultsColumn
              title="Vector Search"
              books={vectorResults}
              loading={loading.vector}
              error={error.vector}
              onViewWords={handleOpenWordList}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ResultsColumn
              title="Text Search"
              books={textResults}
              loading={loading.text}
              error={error.text}
              onViewWords={handleOpenWordList}
            />
          </Grid>
        </Grid>
        <WordList
          open={showWordList}
          bookId={selectedBookId}
          query={query}
          onClose={() => setShowWordList(false)}
        />
        <VectorVisualizer
          open={showVectors}
          query={query}
          bookIds={bookIds}
          onClose={() => setShowVectors(false)}
        />
      </Container>
    </>
  );
};

export default App;
