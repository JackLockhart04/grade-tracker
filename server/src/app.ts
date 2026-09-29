import express from "express";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.get("/api", (_request, response) => {
  response.json({ name: "Grade Tracker API" });
});
