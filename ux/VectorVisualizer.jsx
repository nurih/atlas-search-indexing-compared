import { PCA } from "ml-pca";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Paper,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from "@mui/material";
import { ScatterChart } from "@mui/x-charts/ScatterChart";

const API_BASE_URL = `${window.location.origin}/api`;

const VectorVisualizer = ({ open, bookIds, query, onClose }) => {
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(false);
  const [errorEmbeddings, setErrorEmbeddings] = useState(null);
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (!open || !bookIds?.length || !query) {
      setPoints([]);
      return;
    }

    const fetchEmbeddings = async () => {
      setLoadingEmbeddings(true);
      setErrorEmbeddings(null);
      try {
        const url =
          `${API_BASE_URL}/embedding/` +
          `?user_query=${encodeURIComponent(query)}` +
          `&book_ids=${bookIds.map(encodeURIComponent).join("&book_ids=")}`;
        const { data } = await axios.get(url);
        const justVectors = data.map((d) => d.embedding);
        const justIds = data.map((d) => d._id);
        console.log(justVectors);

        // Expecting data = [ {_id: "abc", embedding:[...]}, ... ]
        if (justVectors.length) {
          const pca = new PCA(justVectors, { center: true, scale: false });
          const reduced = pca
            .predict(justVectors, { nComponents: 2 })
            .to2DArray()
            .map(([x, y], i) => ({ id: justIds[i], x, y }));
          setPoints(reduced);

          console.log(reduced);
        } else setPoints([]);
      } catch (err) {
        console.error("Fetch embeddings Error:", err);
        setErrorEmbeddings("Failed to fetch embeddings.");
      } finally {
        setLoadingEmbeddings(false);
      }
    };

    fetchEmbeddings();
  }, [open, bookIds, query]);

  return (
    <Dialog open={open} maxWidth="lg" fullWidth onClose={onClose}>
      <DialogTitle>Embeddings as Vectors</DialogTitle>
      <DialogContent dividers>
        {loadingEmbeddings && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {errorEmbeddings && (
          <Typography color="error" align="center">
            {errorEmbeddings}
          </Typography>
        )}

        {!loadingEmbeddings && !errorEmbeddings && points.length === 0 && (
          <Typography align="center">Embeddings did not load.</Typography>
        )}

        {points.length > 0 && (
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Embedding Projection (2D)
            </Typography>
            <ScatterChart
              height={400}
              // series={[{ data: points, label: "Embeddings" }]}
              series={points.map((p) => ({ data: [p], label: p.id }))}
              xAxis={[{ label: "PC1" }]}
              yAxis={[{ label: "PC2" }]}
            />
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VectorVisualizer;
