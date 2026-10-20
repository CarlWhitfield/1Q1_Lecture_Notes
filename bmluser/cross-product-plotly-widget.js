(function () {
  "use strict";

  const PLOTLY_URL = "https://cdn.plot.ly/plotly-2.35.2.min.js";
  const ROOT_SELECTOR = "[data-cross-product-widget], #cross-product-widget, .cross-product-widget";
  const STYLE_ID = "cross-product-plotly-widget-styles";

  function loadPlotly() {
    if (window.Plotly) return Promise.resolve(window.Plotly);
    if (window.__crossProductPlotlyPromise) return window.__crossProductPlotlyPromise;

    window.__crossProductPlotlyPromise = new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = PLOTLY_URL;
      script.async = true;
      script.onload = function () { resolve(window.Plotly); };
      script.onerror = function () {
        reject(new Error("The Plotly library could not be loaded."));
      };
      document.head.appendChild(script);
    });

    return window.__crossProductPlotlyPromise;
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .cpw-root {
        box-sizing: border-box;
        width: 100%;
        max-width: 980px;
        margin: 1rem auto;
        padding: 0.9rem;
        border: 1px solid #d9dde3;
        border-radius: 10px;
        background: #ffffff;
        color: #1f2937;
        font-family: Arial, Helvetica, sans-serif;
      }
      .cpw-controls {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr);
        gap: 0.75rem 1.2rem;
        margin-bottom: 0.6rem;
      }
      .cpw-control {
        display: grid;
        grid-template-columns: minmax(170px, auto) 1fr 3.5rem;
        align-items: center;
        gap: 0.55rem;
        font-size: 0.95rem;
      }
      .cpw-control label { font-weight: 600; }
      .cpw-control input { width: 100%; }
      .cpw-value {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .cpw-summary {
        margin: 0.35rem 0 0.2rem;
        text-align: center;
        font-size: 0.95rem;
      }
      .cpw-plot {
        width: 100%;
        height: 610px;
        min-height: 420px;
      }
      .cpw-error {
        padding: 1rem;
        color: #842029;
        background: #f8d7da;
        border: 1px solid #f5c2c7;
        border-radius: 6px;
      }
      @media (max-width: 720px) {
        .cpw-controls { grid-template-columns: 1fr; }
        .cpw-control { grid-template-columns: 1fr; gap: 0.25rem; }
        .cpw-value { text-align: left; }
        .cpw-plot { height: 500px; }
      }
    `;
    document.head.appendChild(style);
  }

  function formatNumber(value) {
    const clean = Math.abs(value) < 1e-10 ? 0 : value;
    return clean.toFixed(2).replace(/\.00$/, "");
  }

  function makeLineTrace(vector, colour, name) {
    return {
      type: "scatter3d",
      mode: "lines",
      x: [0, vector.x],
      y: [0, vector.y],
      z: [0, vector.z],
      line: { color: colour, width: 9 },
      name: name,
      hovertemplate:
        `${name}<br>` +
        `(${formatNumber(vector.x)}, ${formatNumber(vector.y)}, ${formatNumber(vector.z)})` +
        "<extra></extra>"
    };
  }

  function makeConeTrace(vector, colour, name, scale) {
    const length = Math.hypot(vector.x, vector.y, vector.z);
    if (length < 1e-10) {
      return {
        type: "scatter3d",
        mode: "markers",
        x: [0], y: [0], z: [0],
        marker: { size: 1, color: colour, opacity: 0 },
        showlegend: false,
        hoverinfo: "skip"
      };
    }

    const headFraction = Math.min(0.28, 0.38 / Math.max(length, 0.5));
    return {
      type: "cone",
      x: [vector.x],
      y: [vector.y],
      z: [vector.z],
      u: [vector.x * headFraction],
      v: [vector.y * headFraction],
      w: [vector.z * headFraction],
      anchor: "tip",
      sizemode: "absolute",
      sizeref: scale,
      showscale: false,
      colorscale: [[0, colour], [1, colour]],
      hoverinfo: "skip",
      showlegend: false,
      name: name
    };
  }

  function makeLabelTrace(vectors) {
    return {
      type: "scatter3d",
      mode: "text",
      x: vectors.map(function (item) { return item.vector.x * 1.12; }),
      y: vectors.map(function (item) { return item.vector.y * 1.12; }),
      z: vectors.map(function (item) { return item.vector.z * 1.12; }),
      text: vectors.map(function (item) { return item.label; }),
      textfont: {
        size: 16,
        color: vectors.map(function (item) { return item.colour; })
      },
      hoverinfo: "skip",
      showlegend: false
    };
  }

  function makePlaneTrace(range) {
    return {
      type: "surface",
      x: [[-range, range], [-range, range]],
      y: [[-range, -range], [range, range]],
      z: [[0, 0], [0, 0]],
      surfacecolor: [[0, 0], [0, 0]],
      colorscale: [[0, "#90d5ff"], [1, "#90d5ff"]],
      opacity: 0.28,
      showscale: false,
      hoverinfo: "skip",
      name: "Plane containing a and b",
      showlegend: false
    };
  }

  function buildWidget(container, index) {
    if (container.dataset.crossProductInitialised === "true") return;
    container.dataset.crossProductInitialised = "true";
    container.classList.add("cpw-root");

    const uid = `cpw-${index}-${Math.random().toString(36).slice(2, 8)}`;
    container.innerHTML = `
      <div class="cpw-controls">
        <div class="cpw-control">
          <label for="${uid}-magnitude">Magnitude of blue vector:</label>
          <input id="${uid}-magnitude" type="range" min="0.5" max="2" step="0.25" value="1">
          <span class="cpw-value" id="${uid}-magnitude-value">1.00</span>
        </div>
        <div class="cpw-control">
          <label for="${uid}-angle">Angle from red vector:</label>
          <input id="${uid}-angle" type="range" min="0" max="360" step="5" value="45">
          <span class="cpw-value" id="${uid}-angle-value">45°</span>
        </div>
      </div>
      <div class="cpw-summary" id="${uid}-summary"></div>
      <div class="cpw-plot" id="${uid}-plot" role="img" aria-label="Interactive three-dimensional visualisation of two vectors and their cross product"></div>
    `;

    const magnitudeSlider = container.querySelector(`#${uid}-magnitude`);
    const angleSlider = container.querySelector(`#${uid}-angle`);
    const magnitudeValue = container.querySelector(`#${uid}-magnitude-value`);
    const angleValue = container.querySelector(`#${uid}-angle-value`);
    const summary = container.querySelector(`#${uid}-summary`);
    const plot = container.querySelector(`#${uid}-plot`);

    const config = {
      responsive: true,
      displaylogo: false,
      scrollZoom: true,
      modeBarButtonsToRemove: ["toImage", "sendDataToCloud"]
    };

    function update() {
      const magnitude = Number(magnitudeSlider.value);
      const degrees = Number(angleSlider.value);
      const radians = degrees * Math.PI / 180;

      const a = { x: 1, y: 0, z: 0 };
      const b = {
        x: magnitude * Math.cos(radians),
        y: magnitude * Math.sin(radians),
        z: 0
      };
      const cross = {
        x: 0,
        y: 0,
        z: magnitude * Math.sin(radians)
      };

      const range = Math.max(1.5, magnitude + 0.35, Math.abs(cross.z) + 0.35);
      const arrowScale = Math.max(0.12, range * 0.11);

      const traces = [
        makePlaneTrace(range),
        makeLineTrace(a, "#d62728", "a"),
        makeConeTrace(a, "#d62728", "a", arrowScale),
        makeLineTrace(b, "#1f77b4", "b"),
        makeConeTrace(b, "#1f77b4", "b", arrowScale),
        makeLineTrace(cross, "#111111", "a × b"),
        makeConeTrace(cross, "#111111", "a × b", arrowScale),
        makeLabelTrace([
          { vector: a, label: "a", colour: "#d62728" },
          { vector: b, label: "b", colour: "#1f77b4" },
          { vector: cross, label: "a × b", colour: "#111111" }
        ])
      ];

      const layout = {
        margin: { l: 0, r: 0, t: 20, b: 0 },
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#ffffff",
        showlegend: true,
        legend: {
          orientation: "h",
          x: 0.5,
          xanchor: "center",
          y: 1.02,
          yanchor: "bottom"
        },
        scene: {
          aspectmode: "cube",
          camera: {
            eye: { x: 1.45, y: -1.45, z: 1.25 },
            projection: { type: "orthographic" }
          },
          xaxis: {
            title: "x",
            range: [-range, range],
            zeroline: true,
            gridcolor: "#d7dce2",
            backgroundcolor: "#ffffff"
          },
          yaxis: {
            title: "y",
            range: [-range, range],
            zeroline: true,
            gridcolor: "#d7dce2",
            backgroundcolor: "#ffffff"
          },
          zaxis: {
            title: "z",
            range: [-range, range],
            zeroline: true,
            gridcolor: "#d7dce2",
            backgroundcolor: "#ffffff"
          }
        },
        uirevision: "cross-product-camera"
      };

      magnitudeValue.textContent = magnitude.toFixed(2);
      angleValue.textContent = `${degrees}°`;
      summary.innerHTML =
        `<strong>a</strong> = (1, 0, 0), ` +
        `<strong>b</strong> = (${formatNumber(b.x)}, ${formatNumber(b.y)}, 0), ` +
        `<strong>a × b</strong> = (0, 0, ${formatNumber(cross.z)}), ` +
        `|<strong>a × b</strong>| = ${formatNumber(Math.abs(cross.z))}`;

      Plotly.react(plot, traces, layout, config);
    }

    magnitudeSlider.addEventListener("input", update);
    angleSlider.addEventListener("input", update);
    update();

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(function () {
        if (window.Plotly) Plotly.Plots.resize(plot);
      });
      observer.observe(container);
    }
  }

  function initialise() {
    addStyles();
    const containers = Array.from(document.querySelectorAll(ROOT_SELECTOR));
    if (!containers.length) return;

    loadPlotly()
      .then(function () {
        containers.forEach(buildWidget);
      })
      .catch(function (error) {
        containers.forEach(function (container) {
          container.innerHTML = `<div class="cpw-error">${error.message}</div>`;
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
