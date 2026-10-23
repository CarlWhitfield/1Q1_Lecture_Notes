/* Sine secant zoom animation. No GIF, images, or data files required.
 * Requires Plotly.js to be loaded by the host page.
 * Mounts in #sine-secant-widget, .sine-secant-widget, or [data-sine-secant-widget].
 * Options: {autoplay:true, loop:true, frameMs:60, height:400}.
 */
(function () {
  'use strict';
  const ROOT_SELECTOR = '[data-sine-secant-widget], #sine-secant-widget, .sine-secant-widget';
  const H = [1, 0.3, 0.1, 0.03, 0.01, 0.003, 0.001];
  const N = 20;
  const x0 = 3 * Math.PI / 8, y0 = Math.sin(x0);
  const curveX = Array.from({length:10000}, (_, i) => Math.PI * i / 9999);
  const curveY = curveX.map(Math.sin);
  function geometry(h) {
    const xh = x0 + h, yh = Math.sin(xh);
    const scale = Math.max(h, (yh-y0)*Math.PI);
    const xm = (x0+xh)/2, ym = (y0+yh)/2;
    return {xh, yh, xr:[xm-.75*scale, xm+.75*scale],
      yr:[ym-.75*scale/Math.PI, ym+.75*scale/Math.PI]};
  }
  function sequence() {
    const frames = [];
    let xr = [-.05*Math.PI, 1.05*Math.PI], yr = [0,1.1];
    const add = (h, a, b, ticks, box) => frames.push({h, xr:a.slice(), yr:b.slice(), ticks, box});
    const mix = (a,b,t) => a.map((v,i) => (1-t)*v+t*b[i]);
    H.forEach((h,i) => {
      for(let n=0;n<N;n++) add(h,xr,yr,i===0,null);
      if(i===H.length-1) return;
      const next = geometry(H[i+1]);
      for(let n=0;n<N;n++) add(H[i+1],xr,yr,i===0,null);
      for(let n=0;n<N;n++) add(H[i+1],mix(xr,next.xr,n/N),mix(yr,next.yr,n/N),i===0 && n===0,next);
      xr = next.xr; yr = next.yr;
    });
    return frames;
  }
  async function mount(target, options) {
    const opts = Object.assign({autoplay:true,loop:true,frameMs:60,height:400}, options);
    if(!window.Plotly) throw new Error('Load Plotly.js before sine_secant_zoom.js.');
    const host = typeof target==='string' ? document.getElementById(target) : target;
    if(!host) throw new Error('Animation container not found.');
    if(host.dataset.sineSecantInitialised === 'true') return;
    host.dataset.sineSecantInitialised = 'true';
    const root = document.createElement('div');
    root.style.cssText='width:100%;max-width:720px;margin:0 auto;font-family:Arial,sans-serif;';
    const plot = document.createElement('div');
    plot.style.cssText='width:100%;height:'+opts.height+'px;';
    const controls = document.createElement('div');
    controls.style.cssText='display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 16px;';
    const play = document.createElement('button');
    const restart = document.createElement('button'); restart.textContent='Restart';
    const label = document.createElement('label'); label.textContent='Speed: ';
    const speed = document.createElement('select'); speed.setAttribute('aria-label','Animation speed');
    [.25,.5,1,2,4].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v+'\u00d7';o.selected=v===1;speed.appendChild(o);});
    label.appendChild(speed);
    const status = document.createElement('span'); status.setAttribute('aria-live','off');
    [play,restart,label,status].forEach(el=>controls.appendChild(el));
    root.append(plot,controls); host.appendChild(root);
    const frames = sequence();
    let index=0, running=false, destroyed=false, timer=null, rendering=false, pending=false;
    const config={responsive:true,displayModeBar:false,staticPlot:true};
    function data(f) {
      const g=geometry(f.h);
      return [
        {type:'scatter',mode:'lines',x:curveX,y:curveY,line:{color:'#1f77b4',width:2},hoverinfo:'skip'},
        {type:'scatter',mode:'lines+markers',x:[x0,g.xh],y:[y0,g.yh],line:{color:'red',width:2,dash:'dash'},marker:{color:'red',size:7},hoverinfo:'skip'}
      ];
    }
    function layout(f) {
      const axis = range => ({range,autorange:false,showgrid:false,zeroline:false,
        showline:true,mirror:true,linecolor:'#333',linewidth:1,
        showticklabels:f.ticks,ticks:f.ticks?'outside':'',fixedrange:true});
      return {autosize:true,margin:{l:45,r:20,t:20,b:40},showlegend:false,
        paper_bgcolor:'white',plot_bgcolor:'white',font:{family:'Arial',size:14},
        xaxis:axis(f.xr),yaxis:axis(f.yr),
        annotations:[{xref:'paper',yref:'paper',x:.75,y:.35,xanchor:'left',yanchor:'bottom',
          text:'h = '+f.h.toFixed(3),showarrow:false,font:{color:'red',size:18}}],
        shapes:f.box?[{type:'rect',xref:'x',yref:'y',x0:f.box.xr[0],x1:f.box.xr[1],
          y0:f.box.yr[0],y1:f.box.yr[1],line:{color:'black',width:1.5,dash:'dash'},fillcolor:'rgba(0,0,0,0)'}]:[]};
    }
    function sync() {play.textContent=running?'Pause':'Play';status.textContent='h = '+frames[index].h.toFixed(3);}
    function schedule() {
      clearTimeout(timer);
      if(running && !destroyed) timer=setTimeout(tick,opts.frameMs/Number(speed.value));
    }
    async function render() {
      if(destroyed) return;
      if(rendering){pending=true;return;}
      rendering=true;
      try {
        do {pending=false;const f=frames[index];await Plotly.react(plot,data(f),layout(f),config);sync();}
        while(pending && !destroyed);
      } finally {rendering=false;}
    }
    async function tick() {
      if(!running || destroyed) return;
      if(index===frames.length-1){
        if(!opts.loop){running=false;sync();return;}
        index=0;
      } else index++;
      try {await render();schedule();} catch(e){running=false;sync();console.error(e);}
    }
    play.onclick=()=>{running=!running;sync();if(running)schedule();else clearTimeout(timer);};
    restart.onclick=async()=>{clearTimeout(timer);index=0;await render();schedule();};
    speed.onchange=schedule;
    await Plotly.newPlot(plot,data(frames[0]),layout(frames[0]),config);
    running=opts.autoplay;sync();schedule();
    return {play(){running=true;sync();schedule();},pause(){running=false;clearTimeout(timer);sync();},
      async restart(){clearTimeout(timer);index=0;await render();schedule();},
      destroy(){destroyed=true;running=false;clearTimeout(timer);Plotly.purge(plot);root.remove();}};
  }
  window.SineSecantZoom={mount};
  function initialise() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(host => {
      mount(host).catch(error => {
        host.dataset.sineSecantInitialised = 'false';
        host.textContent = error.message;
        console.error(error);
      });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initialise,{once:true});
  else initialise();
})();
