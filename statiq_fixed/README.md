# Statistics Calculator App
Full-stack statistics app — Node.js backend + Web frontend (HTML/JS) + Flutter frontend

---

## QUICK START

### Step 1 — Install & run the Node.js backend
Open a terminal in VS Code and run:
```
cd backend
npm install
npm start
```
You will see:
```
✅  Stats Calculator API  →  http://localhost:3000
🌐  Web App              →  http://localhost:3000/index.html
```

### Step 2A — Open the Web App
Open your browser and go to:
```
http://localhost:3000/index.html
```
That's it! The backend serves the web app automatically.

### Step 2B — Run the Flutter App (optional)
First install Flutter: https://flutter.dev/docs/get-started/install

Then open a second terminal in VS Code:
```
cd flutter_app
flutter pub get
flutter run -d chrome          (run in browser)
flutter run -d windows         (run on Windows desktop)
flutter run -d macos           (run on Mac desktop)
flutter run                    (run on connected Android/iOS phone)
```

---

## VS CODE — RECOMMENDED WORKFLOW

### Open the whole project at once
  File → Open Folder → select the stats_app folder

### Run backend + Flutter at the same time
Use the compound launch config already set up in .vscode/launch.json:
  Go to Run & Debug panel (Ctrl+Shift+D)
  Select "🚀 Backend + Flutter" from the dropdown
  Click the green Play button

### Or use split terminals manually
  Terminal 1:   cd backend       → npm start
  Terminal 2:   cd flutter_app   → flutter run -d chrome

### Recommended VS Code extensions
  - ESLint
  - Prettier
  - Flutter
  - Dart
  - REST Client (to test API endpoints)

---

## PROJECT STRUCTURE

```
stats_app/
│
├── backend/                        ← Node.js API server
│   ├── server.js                   ← Entry point (Express, port 3000)
│   ├── package.json                ← npm dependencies
│   ├── routes/
│   │   └── stats.js                ← All 9 API route definitions
│   ├── controllers/
│   │   └── statsController.js      ← Request handlers (calls engine)
│   └── utils/
│       └── statsEngine.js          ← ALL math calculations (pure JS)
│
├── web_client/                     ← Web frontend (served by backend)
│   ├── index.html                  ← Single-page app (all 9 modules)
│   ├── css/
│   │   └── style.css               ← Full stylesheet
│   └── js/
│       └── app.js                  ← API calls + Chart.js rendering
│
├── flutter_app/                    ← Flutter frontend (mobile/desktop)
│   ├── pubspec.yaml                ← Flutter dependencies
│   └── lib/
│       ├── main.dart               ← App entry point
│       ├── services/
│       │   └── api_service.dart    ← All 9 API calls to backend
│       ├── widgets/
│       │   └── widgets.dart        ← MetricCard, InfoStrip, StatsTable, etc.
│       └── screens/
│           └── home_screen.dart    ← Full UI with all 9 modules
│
└── .vscode/
    ├── launch.json                 ← Run configs + compound launch
    └── settings.json              ← Editor settings

```

---

## API REFERENCE

All endpoints use POST with JSON body and return:
{ "success": true, "result": { ... } }   on success
{ "success": false, "error": "..." }     on error

| Endpoint                        | Body fields                                |
|---------------------------------|--------------------------------------------|
| POST /api/frequency             | data: "1, 2, 3..."                        |
| POST /api/averages              | data: "1, 2, 3..."                        |
| POST /api/variability           | data: "1, 2, 3..."                        |
| POST /api/outliers              | data: "1, 2, 3..."                        |
| POST /api/normal                | value, mean, stdDev (numbers)             |
| POST /api/zscores               | data: "1, 2, 3..."                        |
| POST /api/correlation           | x: "1,2,3", y: "4,5,6"                   |
| POST /api/regression            | x: "1,2,3", y: "4,5,6"                   |
| POST /api/multiple-regression   | y: "...", predictors: ["...", "..."]      |

### Test an API endpoint quickly (with curl):
```
curl -X POST http://localhost:3000/api/averages \
  -H "Content-Type: application/json" \
  -d '{"data": "12, 15, 18, 10, 22, 9, 14"}'
```

---

## MODULES COVERED

1.  Frequency distributions — histogram, frequency table, relative %, cumulative %
2.  Averages — mean, median, mode, skewness, kurtosis, shape detection
3.  Variability — range, variance, std deviation, CV, IQR, fences, box plot
4.  Outliers — IQR fence method + Z-score method, full value table
5.  Normal distribution — Z-score, P(X≤value), P(X>value), percentile, bell curve
6.  Z-scores — full dataset Z-scores with percentile and status
7.  Correlation — Pearson r, Spearman ρ, R², t-statistic, scatter plot
8.  Simple linear regression — slope, intercept, R², SEE, residuals, regression line
9.  Multiple regression — multi-predictor, coefficients, adjusted R², SEE

---

## TROUBLESHOOTING

Problem: "API offline" shown in web app
Fix: Make sure backend is running — cd backend → npm start

Problem: Flutter cannot connect to backend on a physical phone
Fix: Change localhost in api_service.dart to your computer's local IP
  e.g.  static const baseUrl = 'http://192.168.1.10:3000/api';

Problem: npm install fails
Fix: Make sure Node.js is installed — https://nodejs.org (download LTS version)

Problem: flutter pub get fails
Fix: Make sure Flutter SDK is installed — https://flutter.dev/docs/get-started/install

Problem: Port 3000 already in use
Fix: Edit server.js and change PORT = 3000 to PORT = 3001 (or any free port)
     Then update the API base URL in web_client/js/app.js and flutter_app/lib/services/api_service.dart

---

## TECHNOLOGIES USED

Backend:   Node.js + Express.js
Web UI:    HTML5, CSS3, Vanilla JavaScript, Chart.js 4
Flutter:   Dart, Flutter 3, http package, google_fonts
