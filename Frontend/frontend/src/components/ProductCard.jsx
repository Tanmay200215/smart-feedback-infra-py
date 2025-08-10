import { Card, CardActionArea, CardContent, CardMedia, Typography, Chip, Box } from "@mui/material";
import { useState } from "react";

export default function ProductCard({ title, subtitle, img }) {
  const [src, setSrc] = useState(img);

  return (
    <Card
      elevation={3}
      sx={{
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 8 },
      }}
    >
      <CardActionArea>
        <CardMedia
          component="img"
          height="160"
          image={src || "https://via.placeholder.com/640x360?text=No+Image"}
          alt={title}
          onError={() => setSrc("https://via.placeholder.com/640x360?text=Image+unavailable")}
        />
        <CardContent>
          <Typography variant="h3" sx={{ fontSize: "1.05rem", mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {subtitle}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip size="small" label="Popular" color="primary" variant="outlined" />
            <Chip size="small" label="v2.1" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
