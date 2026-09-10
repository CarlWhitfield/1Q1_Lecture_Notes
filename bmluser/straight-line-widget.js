/* straight_line_widget.js
 * Interactive plot of y = mx + c with slider controls.
 * Requires Plotly.js to be loaded before this file.
 */
(() => {
  "use strict";

  function initialiseStraightLineWidget() {
    const container = document.getElementById("straight-line-widget");
    if (!container || container.dataset.initialised === "true") return;

    if (typeof Plotly === "undefined") {
      container.textContent = "This interactive plot requires Plotly.js.";
      console.error("Straight-line widget: Plotly.js has not been loaded.");
      return;
    }

    container.dataset.initialised = "true";

    const xMin = -10;
    const xMax = 10;
    const yMin = -10;
    const yMax = 10;

    const initialM = Number(container.dataset.m ?? 1);
    const initialC = Number(container.dataset.c ?? 0);

    container.innerHTML = `
      <div class="slw-plot" aria-label="Interactive plot of y equals m x plus c"></div>
      <div class="slw-controls">
        <label for="slw-slope">
          <span>Slope, <i>m</i> = <output id="slw-slope-value">${initialM.toFixed(1)}</output></span>
          <input id="slw-slope" type="range" min="-2" max="2" step="0.1" value="${initialM}">
        </label>
        <label for="slw-intercept">
          <span>Intercept, <i>c</i> = <output id="slw-intercept-value">${initialC.toFixed(1)}</output></span>
          <input id="slw-intercept" type="range" min="-5" max="5" step="0.2" value="${initialC}">
        </label>
        <div class="slw-equation" aria-live="polite"></div>
      </div>`;

    const style = document.createElement("style");
    style.textContent = `
      #straight-line-widget {
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #straight-line-widget .slw-plot {
        width: 100%;
        height: min(68vw, 600px);
        min-height: 420px;
      }
      #straight-line-widget .slw-controls {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 0.8rem 1.4rem;
        align-items: end;
        margin-top: 0.5rem;
      }
      #straight-line-widget .slw-controls label {
        display: grid;
        gap: 0.35rem;
        font-weight: 600;
      }
      #straight-line-widget input[type="range"] { width: 100%; }
      #straight-line-widget output { font-variant-numeric: tabular-nums; }
      #straight-line-widget .slw-equation {
        grid-column: 1 / -1;
        text-align: centre;
        text-align: center;
        font-size: 1.1rem;
        font-weight: 600;
        min-height: 1.5em;
      }
      @media (max-width: 560px) {
        #straight-line-widget .slw-controls { grid-template-columns: 1fr; }
        #straight-line-widget .slw-equation { grid-column: 1; }
        #straight-line-widget .slw-plot { min-height: 360px; }
      }
    `;
    container.prepend(style);

    const plot = container.querySelector(".slw-plot");
    const slopeSlider = container.querySelector("#slw-slope");
    const interceptSlider = container.querySelector("#slw-intercept");
    const slopeValue = container.querySelector("#slw-slope-value");
    const interceptValue = container.querySelector("#slw-intercept-value");
    const equation = container.querySelector(".slw-equation");

    const x = Array.from({ length: 401 }, (_, i) => xMin + (xMax - xMin) * i / 400);

    const trace = {
      type: "scatter",
      mode: "lines",
      x,
      y: x.map(v => initialM * v + initialC),
      line: { color: "#c43c39", width: 4 },
      hovertemplate: "x = %{x:.2f}<br>y = %{y:.2f}<extra></extra>",
      showlegend: false,
      cliponaxis: true
    };

    const layout = {
      margin: { l: 52, r: 28, b: 48, t: 20 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "white",
      hovermode: "closest",
      dragmode: "pan",
      xaxis: {
        range: [xMin, xMax],
        fixedrange: true,
        tickmode: "linear",
        tick0: -10,
        dtick: 2,
        showgrid: true,
        gridcolor: "#dddddd",
        zeroline: true,
        zerolinecolor: "#222222",
        zerolinewidth: 2,
        showline: false,
        title: { text: "x", standoff: 8 },
        constrain: "domain"
      },
      yaxis: {
        range: [yMin, yMax],
        fixedrange: true,
        tickmode: "linear",
        tick0: -10,
        dtick: 2,
        showgrid: true,
        gridcolor: "#dddddd",
        zeroline: true,
        zerolinecolor: "#222222",
        zerolinewidth: 2,
        showline: false,
        title: { text: "y", standoff: 8 },
        scaleanchor: "x",
        scaleratio: 1
      },
      // Arrowheads and labels make the two zero-lines read as coordinate axes.
      annotations: [
        { x: 10, y: 0, ax: 9.25, ay: 0, xref: "x", yref: "y", axref: "x", ayref: "y",
          showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2, arrowcolor: "#222", text: "" },
        { x: 0, y: 10, ax: 0, ay: 9.25, xref: "x", yref: "y", axref: "x", ayref: "y",
          showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2, arrowcolor: "#222", text: "" }
      ],
      uirevision: "straight-line-widget"
    };

    const config = {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d", "zoom2d", "zoomIn2d", "zoomOut2d"]
    };

    Plotly.newPlot(plot, [trace], layout, config);

    function formatEquation(m, c) {
      const mText = Number(m.toFixed(1)).toString();
      const absC = Number(Math.abs(c).toFixed(1)).toString();
      if (Math.abs(c) < 1e-12) return `y = ${mText}x`;
      return `y = ${mText}x ${c > 0 ? "+" : "−"} ${absC}`;
    }

    function updatePlot() {
      const m = Number(slopeSlider.value);
      const c = Number(interceptSlider.value);
      slopeValue.value = m.toFixed(1);
      slopeValue.textContent = m.toFixed(1);
      interceptValue.value = c.toFixed(1);
      interceptValue.textContent = c.toFixed(1);
      equation.textContent = formatEquation(m, c);
      Plotly.restyle(plot, { y: [x.map(v => m * v + c)] }, [0]);
    }

    slopeSlider.addEventListener("input", updatePlot);
    interceptSlider.addEventListener("input", updatePlot);
    updatePlot();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initialiseStraightLineWidget, { once: true });
  } else {
    initialiseStraightLineWidget();
  }
})();
