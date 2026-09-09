# Graph Visualizer App

## Overview
The Graph Visualizer App is a JavaScript application that allows users to visualize mathematical functions through interactive graphs. It features two graphs: one displaying the equations \(y = t^2 - t + 1\) and \(x = 2\sin(t) - \cos(3t)\) plotted against the variable \(t\), and another graph showing \(y\) plotted against \(x\). Users can manipulate a slider to select a value of \(t\), which dynamically updates the graphs and highlights the corresponding points.

## Features
- Interactive line graphs for mathematical functions.
- Slider to select values of \(t\) between \(0\) and \(2\pi\).
- Dynamic updates to the graphs based on slider input.
- Visual indicators for selected values on both graphs.

## Project Structure
```
graph-visualizer-app
├── src
│   ├── index.html      # HTML structure for the application
│   ├── app.js          # JavaScript code for graph generation and interaction
│   └── styles.css      # CSS styles for the application layout
├── package.json        # npm configuration file with dependencies
└── README.md           # Documentation for the project
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd graph-visualizer-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Open `src/index.html` in a web browser to view the application.
2. Use the slider to select a value of \(t\). The graphs will update automatically to reflect the selected value.

## Dependencies
- Chart.js: A JavaScript library for creating charts and graphs.

## License
This project is licensed under the MIT License.