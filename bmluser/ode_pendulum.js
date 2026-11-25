/* BookML: <div id="damped-oscillator-widget"></div>
   Load this script after the container. It reuses Plotly or loads it from the CDN. */
(function () {
  'use strict';
  const G = 9.81, W = Math.sqrt(G), A = Math.PI / 6, T = 5;
  const lambdaAt = ratio => ratio * W;
  const time = Array.from({length: 1001}, (_, i) => T * i / 1000);
  const presets = [
    [0, 'Undamped: λ = 0'], [0.5, 'Underdamped: λ = √g/2'],
    [1, 'Critical: λ = √g'], [2, 'Overdamped: λ = 2√g']
  ];
  function theta(t, lambda) {
    if (lambda === W) return A * Math.exp(-lambda * t) * (1 + lambda * t);
    if (lambda < W) {
      const w = Math.sqrt((W - lambda) * (W + lambda)), u = w * t;
      return A * Math.exp(-lambda * t) * (Math.cos(u) + lambda * (u === 0 ? t : Math.sin(u) / w));
    }
    const q = Math.sqrt((lambda - W) * (lambda + W));
    // expm1 avoids cancellation between nearly equal exponentials near critical damping.
    const delta = Math.expm1(-2 * q * t);
    return A * Math.exp((-G / (lambda + q)) * t) * (1 + delta / 2 - lambda * delta / (2 * q));
  }
  function loadPlotly() {
    if (window.Plotly) return Promise.resolve(window.Plotly);
    if (!window.__dampedOscillatorPlotlyLoader) {
      window.__dampedOscillatorPlotlyLoader = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
        script.onload = () => window.Plotly ? resolve(window.Plotly) : reject(Error('Plotly did not initialise.'));
        script.onerror = () => reject(Error('Could not load Plotly. Load it locally or check your connection.'));
        document.head.appendChild(script);
      }).catch(error => { delete window.__dampedOscillatorPlotlyLoader; throw error; });
    }
    return window.__dampedOscillatorPlotlyLoader;
  }
  function el(tag, css, text) {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function geometry(t, lambda) {
    const angle = theta(t, lambda);
    return {angle, x: Math.sin(angle), y: -Math.cos(angle)};
  }
  async function mount(host) {
    if (typeof host === 'string') host = document.getElementById(host);
    if (!host) throw Error('Damped oscillator container not found.');
    if (!host.__animatedOscillator) {
      host.__animatedOscillator = build(host).catch(error => {
        delete host.__animatedOscillator;
        throw error;
      });
    }
    return host.__animatedOscillator;
  }
  async function build(host) {
    const P = await loadPlotly();
    const root = el('div', 'max-width:1000px;margin:auto;padding:8px;box-sizing:border-box;background:#fff;color:#17253a;font:14px system-ui,Arial,sans-serif;');
    const chart = el('div', 'width:100%;height:390px;');
    const panel = el('div', 'padding:12px;background:#f3f6fa;border-radius:8px;');
    const sliderLabel = el('label', 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-weight:600;', 'Damping λ');
    const slider = el('input', 'flex:1 1 0;min-width:48px;');
    Object.assign(slider, {type:'range', min:'0', max:'2', step:'0.0025', value:'0.5'});
    slider.setAttribute('aria-label', 'Damping lambda');
    const value = el('output', 'min-width:112px;white-space:nowrap;font-variant-numeric:tabular-nums;');
    sliderLabel.append(slider, value);
    const rowStyle = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:9px;';
    const shortcuts = el('div', rowStyle), playback = el('div', rowStyle);
    const buttonStyle = 'padding:6px 9px;border:1px solid #8695a9;border-radius:5px;background:white;color:#17253a;cursor:pointer;';
    function button(text) { const b = el('button', buttonStyle, text); b.type = 'button'; return b; }
    const buttons = presets.map(([i, label]) => {
      const b = button(label);
      shortcuts.append(b);
      b.addEventListener('click', () => { slider.value = String(i); changeDamping(); });
      return [i, b];
    });
    const play = button('Pause'), restart = button('Restart');
    const clock = el('span', 'font-variant-numeric:tabular-nums;');
    const regime = el('span', 'font-weight:600;');
    const info = el('div', 'margin-top:9px;color:#42526a;', 'g = 9.81  ·  θ(0) = π/6 rad  ·  θ′(0) = 0');
    playback.append(play, restart, clock, regime);
    panel.append(sliderLabel, shortcuts, playback, info);
    root.append(chart, panel); host.append(root);
    let ratio = 0.5, lambda = lambdaAt(ratio), active = false, dead = false;
    let origin = 0, pausedAt = 0, needsDraw = false, raf = null, busy = false, drawnLambda = lambda;
    const currentTime = now => active ? (Math.max(0, now - origin) / 1000) % T : pausedAt;
    function labels() {
      const text = ratio === 0 ? 'Undamped' : ratio === 1 ? 'Critically damped' : ratio < 1 ? 'Underdamped' : 'Overdamped';
      if (ratio > 0) value.textContent = 'λ = ' + ratio + '√g';
      else value.textContent = 'λ = ' + ratio;
      slider.setAttribute('aria-valuetext', 'lambda divided by square root of g equals ' + ratio + ', ' + text);
      regime.textContent = text;
      for (const [k, b] of buttons) {
        b.setAttribute('aria-pressed', String(k === ratio));
        b.style.background = k === ratio ? '#174b84' : '#fff';
        b.style.color = k === ratio ? '#fff' : '#17253a';
      }
    }
    function changeDamping() {
      ratio = Number(slider.value); lambda = lambdaAt(ratio);
      labels(); request();
    }
    function request() {
      needsDraw = true;
      if (!busy && raf === null && !dead) raf = requestAnimationFrame(draw);
    }
    async function draw(now) {
      raf = null;
      if (dead) return;
      busy = true; needsDraw = false;
      const t = currentTime(now), damping = lambda;
      const {angle, x, y} = geometry(t, damping);
      const indices = [1, 2], xs = [[t], [0, x]], ys = [[angle], [0, y]];
      if (damping !== drawnLambda) {
        indices.unshift(0); xs.unshift(time); ys.unshift(time.map(s => theta(s, damping)));
      }
      try {
        // One update keeps the point, curve and pendulum on the same simulation time.
        await P.restyle(chart, {x:xs, y:ys}, indices);
        drawnLambda = damping;
        if (!dead) clock.textContent = 't = ' + t.toFixed(2) + ' s';
      } catch (error) {
        active = false; pausedAt = t; play.textContent = 'Play';
        if (!dead) clock.textContent = 'Animation update failed. Try Restart.';
        console.error(error);
      } finally {
        busy = false;
        if (dead) P.purge(chart);
        else if (active || needsDraw) request();
      }
    }
    const first = geometry(0, lambda), accent = '#ba3154';
    const traces = [
      {type:'scatter',mode:'lines',x:time,y:time.map(t => theta(t, lambda)),line:{color:'#235da8',width:2.5},hovertemplate:'t = %{x:.2f} s<br>θ = %{y:.3f} rad<extra></extra>'},
      {type:'scatter',mode:'markers',x:[0],y:[A],marker:{size:10,color:accent},hoverinfo:'skip'},
      {type:'scatter',mode:'lines+markers',xaxis:'x2',yaxis:'y2',x:[0,first.x],y:[0,first.y],line:{color:'#536783',width:3},marker:{size:[8,19],color:['#536783',accent]},hoverinfo:'skip'}
    ];
    const axes = {fixedrange:true,gridcolor:'#edf0f5',zerolinecolor:'#9ba8b8'};
    const pendulumAxes = {visible:false,fixedrange:true,constrain:'domain'};
    const layout = {
      autosize:true, showlegend:false, margin:{l:59,r:8,t:33,b:51},
      paper_bgcolor:'#fff', plot_bgcolor:'#fff', font:{family:'system-ui, Arial, sans-serif',color:'#17253a'},
      xaxis:{...axes,domain:[0,.69],range:[0,T],title:{text:'t (s)'}},
      yaxis:{...axes,anchor:'x',range:[-.60,.60],title:{text:'θ (rad)'}},
      xaxis2:{...pendulumAxes,anchor:'y2',domain:[.74,1],range:[-.68,.68]},
      yaxis2:{...pendulumAxes,anchor:'x2',range:[-1.18,.20],scaleanchor:'x2',scaleratio:1},
      shapes:[{type:'line',xref:'x2',yref:'y2',x0:0,x1:0,y0:0,y1:-1,line:{color:'#acb9c9',width:1,dash:'dot'},layer:'below'}],
      annotations:[{xref:'paper',yref:'paper',x:.345,y:1.08,text:'Angular displacement',showarrow:false},
        {xref:'paper',yref:'paper',x:.87,y:1.08,text:'Pendulum',showarrow:false}]
    };
    try {
      await P.newPlot(chart, traces, layout, {responsive:true,displayModeBar:false,scrollZoom:false});
    } catch (error) { root.remove(); throw error; }
    slider.addEventListener('input', changeDamping);
    play.addEventListener('click', () => {
      const now = performance.now();
      if (active) { pausedAt = currentTime(now); active = false; }
      else { origin = now - pausedAt * 1000; active = true; }
      play.textContent = active ? 'Pause' : 'Play';
      request();
    });
    restart.addEventListener('click', () => {
      origin = performance.now(); pausedAt = 0; request();
    });
    labels(); clock.textContent = 't = 0.00 s';
    origin = performance.now(); active = true; request();
    return {destroy() {
      dead = true; active = false;
      if (raf !== null) cancelAnimationFrame(raf);
      if (!busy) P.purge(chart);
      root.remove(); delete host.__animatedOscillator;
    }};
  }
  window.DampedOscillatorAnimated = {mount};
  function init() {
    document.querySelectorAll('#damped-oscillator-widget, .damped-oscillator-widget, [data-damped-oscillator-widget]').forEach(host => {
      mount(host).catch(error => { host.append(el('p', 'color:#a10020;', error.message)); console.error(error); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
