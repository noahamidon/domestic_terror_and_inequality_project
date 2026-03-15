# Does Inequality Breed Domestic Terror?
### An Interactive Visualization of Economic Inequality and Domestic Terrorism (1970–2020)

An interactive data visualization exploring the relationship between economic inequality and domestic terrorism across 50 years of global data.

---

## Overview

This project examines whether income inequality (measured by the Gini coefficient) correlates with the frequency and severity of domestic terrorist attacks at the country level. It features an interactive choropleth world map and a scatter plot broken down by world region.

---

## Visualizations

- **World Map** — Choropleth of domestic terror incidents by country; hover for country details, click for historical trends
- **Scatter Plot** — Inequality (Gini) vs. political violence by world region, with interactive region filtering

---

## Data Sources

**Global Terrorism Database (GTD)**
START, National Consortium for the Study of Terrorism and Responses to Terrorism (2022). Covers 1970–2020. Filtered to domestic attacks only (`INT_LOG == 0`).
https://www.start.umd.edu/gtd

**World Income Inequality Database (WIID)**
UNU-WIDER, Version 29 April 2025.
https://doi.org/10.35188/UNU-WIDER/WIID-290425

---

## Data Processing

Raw data was cleaned and merged in R (`data/cleaning.R`):

- GTD filtered to domestic incidents, aggregated by country and year (total events, total deaths, top 5 attack types)
- WIID Gini coefficients averaged by country-year, joined with terrorism data
- Output: `data/processed_gtd.csv` and `data/processed_wiidgtd.csv`

---

## Tech Stack

| Layer | Tools |
|---|---|
| Visualization | D3.js v7, TopoJSON v3 |
| Data Processing | R, tidyverse, readxl |
| Frontend | Vanilla HTML/CSS/JS (no framework) |

---

## Running Locally

Open `main.html` directly in a browser — no local server required.

---

## Author

Noah Amidon — QSS 19, Dartmouth College
