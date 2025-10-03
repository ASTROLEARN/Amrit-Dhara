# Heavy Metal Pollution Index (HMPI) Calculator

A comprehensive web application for analyzing groundwater quality by calculating Heavy Metal Pollution Indices (HPI, HEI, CD, NPI) with interactive maps and data visualization.

## Features

### 🧪 Core Functionality
- **Multiple Input Methods**: CSV file upload with drag-and-drop support and manual data entry
- **Four Pollution Indices**: HPI, HEI, CD, and NPI calculations using WHO standards
- **Interactive Mapping**: Geographic visualization with color-coded pollution levels
- **Data Visualization**: Bar charts, pie charts, and trend analysis
- **Export Options**: PDF and CSV export functionality

### 📊 Supported Indices

1. **Heavy Metal Pollution Index (HPI)**
   - Formula: `HPI = (∑ᵢ (Wᵢ × Qᵢ)) / (∑ᵢ Wᵢ)`
   - Categories: Clean (<100), Moderate (100-150), High (>150)

2. **Heavy Metal Evaluation Index (HEI)**
   - Formula: `HEI = ∑ᵢ (Cᵢ / Sᵢ)`
   - Categories: Clean (<40), Moderate (40-80), High (>80)

3. **Contamination Degree (CD)**
   - Formula: `CD = ∑ᵢ (Cᵢ / Bᵢ)`
   - Categories: Low (<1), Medium (1-3), High (>3)

4. **Nemerow Pollution Index (NPI)**
   - Formula: `NPI = √[(max(Pᵢ))² + (avg(Pᵢ))²] / 2`
   - Categories: Clean (<1), Slight (1-2), Moderate (2-3), Severe (>3)

### 🗺️ Interactive Features
- Real-time map visualization with Leaflet
- Color-coded markers based on pollution levels
- Detailed popup information for each sample
- Support for multiple index visualizations

### 📈 Data Analytics
- Metal concentration comparisons
- Quality distribution pie charts
- Temporal trend analysis
- Statistical summaries

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Mapping**: Leaflet with React-Leaflet
- **Charts**: Recharts
- **File Processing**: PapaParse for CSV handling
- **Export**: jsPDF for PDF generation

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Usage

### Quick Start
1. Click "Generate 10 Sample Records" to create test data
2. Navigate through the tabs to explore different features

### CSV Upload Format
Required columns:
- `SampleID`: Unique sample identifier
- `Location`: Location name (optional)
- `Lat`: Latitude
- `Lng`: Longitude
- `As`: Arsenic concentration (mg/L)
- `Cd`: Cadmium concentration (mg/L)
- `Cr`: Chromium concentration (mg/L)
- `Pb`: Lead concentration (mg/L)
- `Hg`: Mercury concentration (mg/L)
- `Ni`: Nickel concentration (mg/L)
- `Cu`: Copper concentration (mg/L)
- `Zn`: Zinc concentration (mg/L)

Example:
```csv
SampleID,Location,Lat,Lng,As,Cd,Cr,Pb,Hg,Ni,Cu,Zn
S001,Site A,40.7128,-74.0060,0.005,0.001,0.02,0.008,0.0005,0.03,0.5,1.2
```

### Manual Data Entry
1. Fill in the sample information
2. Enter coordinates (latitude/longitude)
3. Input metal concentrations in mg/L
4. Click "Calculate Indices" to process

## WHO Standards Reference

| Metal | Symbol | Permissible (Sᵢ) | Background (Bᵢ) |
|-------|--------|------------------|------------------|
| Arsenic | As | 0.01 mg/L | 0.001 mg/L |
| Cadmium | Cd | 0.003 mg/L | 0.0005 mg/L |
| Chromium | Cr | 0.05 mg/L | 0.01 mg/L |
| Lead | Pb | 0.01 mg/L | 0.01 mg/L |
| Mercury | Hg | 0.001 mg/L | 0.0001 mg/L |
| Nickel | Ni | 0.07 mg/L | 0.02 mg/L |
| Copper | Cu | 2.0 mg/L | 0.1 mg/L |
| Zinc | Zn | 3.0 mg/L | 0.5 mg/L |

## API Endpoints

- `POST /api/upload-csv` - Process CSV file uploads
- `POST /api/calculate` - Calculate indices for manual entry
- `GET /api/results` - Retrieve processed data
- `POST /api/export` - Export data in CSV or PDF format
- `POST /api/generate-sample` - Generate sample data for testing

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── upload-csv/
│   │   ├── calculate/
│   │   ├── results/
│   │   ├── export/
│   │   └── generate-sample/
│   ├── page.tsx          # Main application page
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── csv-upload-form.tsx
│   ├── manual-entry-form.tsx
│   ├── results-dashboard.tsx
│   ├── map-view.tsx
│   ├── data-visualization.tsx
│   └── export-panel.tsx
├── lib/
│   ├── hmpi-calculations.ts  # Core calculation logic
│   ├── db.ts                  # Database client
│   └── utils.ts
└── hooks/
    └── use-toast.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting:
   ```bash
   npm run lint
   ```
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue on the GitHub repository.