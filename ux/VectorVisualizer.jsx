import { PCA } from "ml-pca";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  CircularProgress,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ScatterChart } from "@mui/x-charts/ScatterChart";

const API_BASE_URL = `${window.location.origin}/api`;

const VectorVisualizer = ({ bookIds, query }) => {
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
    <>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography component="span">Embedding Projection (2D)</Typography>
        </AccordionSummary>
        <AccordionDetails>
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
            <ScatterChart
              height={600}
              // series={[{ data: points, label: "Embeddings" }]}
              series={points.map((p, i) => ({
                data: [p],
                label: p.id,
                markerSize: i ? 8 : 12                
              }))}
              xAxis={[{ label: "Principle Component 1", min: -1, max: 1 }]}
              yAxis={[{ label: "Principle Component 2", min: -1, max: 1 }]}
            />
          )}
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default VectorVisualizer;
