import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

const API_BASE_URL = `${document.location.href}api`;

const WordList = ({ open, bookId, query, onClose }) => {
  const [words, setWords] = useState([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [errorWords, setErrorWords] = useState(null);
  const [wordMatch, setWordMatch] = useState([]);

  const queryWords = String(query).split(" ").filter(Boolean);

  useEffect(() => {
    if (open && bookId) {
      const fetchWords = async () => {
        setLoadingWords(true);
        setErrorWords(null);
        try {
          const response = await axios.get(
            `${API_BASE_URL}/book/${bookId.replace(/_\d+/, "")}/words`
          );
          setWords(response.data);

          const matched = queryWords.filter((qw) =>
            [...response.data].some((word) => word.includes(qw))
          );
          setWordMatch(matched);
        } catch (err) {
          setErrorWords("Failed to fetch words for this book.");
          console.error("Fetch Words Error:", err);
        } finally {
          setLoadingWords(false);
        }
      };
      fetchWords();
    } else {
      // Reset words when dialog is closed
      setWords([]);
    }
  }, [open, bookId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Words in Book</DialogTitle>
      <DialogContent dividers>
        {loadingWords && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {errorWords && (
          <Typography color="error" align="center">
            {errorWords}
          </Typography>
        )}
        {!loadingWords && !errorWords && words.length === 0 && (
          <Typography align="center">No words found for this book.</Typography>
        )}
        {!loadingWords && !errorWords && words.length > 0 && (
          <div>
            {wordMatch.length && (
              <Stack direction="row" spacing={1}>
                {wordMatch.map((w) => (
                  <Chip label={w} color="success" />
                ))}
              </Stack>
            )}
            <List dense sx={{ columnCount: 3, columnGap: "20px" }}>
              {words.map((word, index) => (
                <ListItem key={index}>
                  <ListItemText primary={word} />
                </ListItem>
              ))}
            </List>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WordList;
