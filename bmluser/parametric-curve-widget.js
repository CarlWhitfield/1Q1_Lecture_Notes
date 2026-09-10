/* parametric_curve_widget.js
 * Interactive Plotly visualisation of x = R cos(t), y = R sin(t), 0 <= t <= 2*pi.
 * Requires Plotly.js to be loaded before this script.
 */
window.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const SCRIPT = document.currentScript;
  const containerId = SCRIPT?.dataset.container || "parametric-curve-widget";
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Parametric curve widget: no element with id "${containerId}".`);
    return;
  }
  if (typeof Plotly === "undefined") {
    container.textContent = "This interactive plot requires Plotly.js.";
    console.error("Parametric curve widget: Plotly.js has not been loaded.");
    return;
  }

  const parsedR = Number(SCRIPT?.dataset.r ?? container.dataset.r ?? 1);
  const R = Number.isFinite(parsedR) && parsedR > 0 ? parsedR : 1;
  const TWO_PI = 2 * Math.PI;
  const N = 501;

  // Build the controls and plot locally so multiple widgets can coexist.
  container.innerHTML = `
    <div class="pcw-controls" role="group" aria-label="Preset views">
      <button type="button" data-view="xt">View x-t plane</button>
      <button type="button" data-view="yt">View y-t plane</button>
      <button type="button" data-view="xy">View x-y plane</button>
      <button type="button" data-view="3d">3D view</button>
    </div>
    <div class="pcw-plot" aria-label="Interactive three-dimensional parametric curve"></div>
    <div class="pcw-slider-row">
      <label>t = <output>0.000</output>
        <input type="range" min="0" max="${TWO_PI}" step="0.001" value="0"
               aria-label="Parameter t between zero and two pi">
      </label>
      <span class="pcw-point-values"></span>
    </div>`;

  // Self-contained styles. Move these rules to a CSS file if preferred.
  const style = document.createElement("style");
  style.textContent = `
    #${CSS.escape(containerId)} { width: 100%; font-family: system-ui, sans-serif; }
    #${CSS.escape(containerId)} .pcw-controls { display:flex; flex-wrap:wrap; gap:.5rem; margin:0 0 .5rem; }
    #${CSS.escape(containerId)} button { padding:.45rem .75rem; border:1px solid #65758b; border-radius:.35rem; background:#fff; cursor:pointer; }
    #${CSS.escape(containerId)} button:hover, #${CSS.escape(containerId)} button:focus { background:#eef4fb; }
    #${CSS.escape(containerId)} .pcw-plot { width:100%; height:min(68vh,620px); min-height:420px; }
    #${CSS.escape(containerId)} .pcw-slider-row { display:flex; flex-wrap:wrap; align-items:center; gap:1rem; margin-top:.35rem; }
    #${CSS.escape(containerId)} label { display:flex; align-items:center; gap:.55rem; font-weight:600; }
    #${CSS.escape(containerId)} input[type=range] { width:min(52vw,430px); }
    #${CSS.escape(containerId)} .pcw-point-values { font-variant-numeric:tabular-nums; }
  `;
  container.prepend(style);

  const plot = container.querySelector(".pcw-plot");
  const slider = container.querySelector('input[type="range"]');
  const output = container.querySelector("output");
  const values = container.querySelector(".pcw-point-values");

  const t = Array.from({ length: N }, (_, i) => TWO_PI * i / (N - 1));
  const x = t.map(v => R * Math.cos(v));
  const y = t.map(v => R * Math.sin(v));

  const curveLine = {
    type: "scatter3d",
    mode: "lines",
    x, y, z: t,
    line: { color: "rgba(60,60,70,0.45)", width: 5 },
    hoverinfo: "skip",
    showlegend: false
  };

  // Dense coloured markers give the curve its t-dependent heat-map gradient.
  const colouredCurve = {
    type: "scatter3d",
    mode: "markers",
    x, y, z: t,
    marker: {
      size: 3.8,
      color: t,
      cmin: 0,
      cmax: TWO_PI,
      colorscale: "Turbo",
      showscale: true,
      colorbar: {
        title: { text: "t" },
        tickvals: [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, TWO_PI],
        ticktext: ["0", "π/2", "π", "3π/2", "2π"]
      }
    },
    customdata: t,
    hovertemplate: "x=%{x:.3f}<br>y=%{y:.3f}<br>t=%{customdata:.3f}<extra></extra>",
    showlegend: false
  };

  const selectedPoint = {
    type: "scatter3d",
    mode: "markers",
    x: [R], y: [0], z: [0],
    marker: { size: 8, color: "#111111", line: { color: "white", width: 2 } },
    hovertemplate: "selected<br>x=%{x:.3f}<br>y=%{y:.3f}<br>t=%{z:.3f}<extra></extra>",
    showlegend: false
  };

  const camera3d = { eye: { x: 1.55, y: 1.55, z: 1.15 }, up: { x: 0, y: 0, z: 1 }, projection: { type: "orthographic" } };
  const layout = {
    margin: { l: 0, r: 55, b: 0, t: 12 },
    paper_bgcolor: "rgba(0,0,0,0)",
    scene: {
      xaxis: { title: "x", range: [-1.25 * R, 1.25 * R], zeroline: true },
      yaxis: { title: "y", range: [-1.25 * R, 1.25 * R], zeroline: true },
      zaxis: {
        title: { text: "t" },
        range: [0, TWO_PI],
        tickvals: [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, TWO_PI],
        ticktext: ["0", "π/2", "π", "3π/2", "2π"]
      },
      aspectmode: "manual",
      aspectratio: { x: 1, y: 1, z: 1.65 },
      camera: camera3d,
      projection: { type: "orthographic" },
      dragmode: "orbit"
    },
    uirevision: "preserve-user-camera"
  };

  const config = { responsive: true, displaylogo: false, scrollZoom: true };
  Plotly.newPlot(plot, [curveLine, colouredCurve, selectedPoint], layout, config);

  function updatePoint() {
    const tv = Number(slider.value);
    const xv = R * Math.cos(tv);
    const yv = R * Math.sin(tv);
    output.value = tv.toFixed(3);
    output.textContent = tv.toFixed(3);
    values.textContent = `x = ${xv.toFixed(3)}, y = ${yv.toFixed(3)}`;
    Plotly.restyle(plot, { x: [[xv]], y: [[yv]], z: [[tv]] }, [2]);
  }
  slider.addEventListener("input", updatePoint);
  updatePoint();

  const cameras = {
    // Looking along y leaves x horizontal and t vertical.
    xt: { eye: { x: 0, y: 2.6, z: 0 }, up: { x: 1, y: 0, z: 0 }, projection: { type: "orthographic" } },
    // Looking along x leaves y horizontal and t vertical.
    yt: { eye: { x: -2.6, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 }, projection: { type: "orthographic" } },
    // Looking down the t axis leaves x and y visible.
    xy: { eye: { x: 0, y: 0, z: 2.8 }, up: { x: 0, y: 1, z: 0 }, projection: { type: "orthographic" } },
    "3d": camera3d
  };

  container.querySelectorAll("button[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      Plotly.relayout(plot, { "scene.camera": cameras[button.dataset.view] });
    });
  });
});
