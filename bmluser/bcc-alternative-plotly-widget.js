/* BCC primitive-cell widget. Mount: <div class="bcc-alternative-widget"></div>
   Reuses window.Plotly; otherwise loads the pinned CDN build below.
   No external images or data are required. */
(function () {
  'use strict';
  const SELECTOR = '.bcc-alternative-widget, #bcc-alternative-widget, [data-bcc-alternative-widget]';
  function library() {
    if (window.Plotly) return Promise.resolve(window.Plotly);
    if (window.__bccPlotlyLoader) return window.__bccPlotlyLoader;
    window.__bccPlotlyLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
      script.onload = () => window.Plotly ? resolve(window.Plotly) : reject(Error('Plotly did not initialise.'));
      script.onerror = () => { window.__bccPlotlyLoader = null; reject(Error('Unable to load Plotly. Check your connection or load Plotly locally.')); };
      document.head.appendChild(script);
    });
    return window.__bccPlotlyLoader;
  }
  const bits = [];
  for (let x=0;x<2;x++) for(let y=0;y<2;y++) for(let z=0;z<2;z++) bits.push([x,y,z]);
  const basis = [[1,0,0],[0,1,0],[.5,.5,.5]];
  const primitive = bits.map(b => [0,1,2].map(d => b.reduce((s,v,i)=>s+v*basis[i][d],0)));
  const edges = [];
  bits.forEach((b,i)=>bits.forEach((c,j)=>{
    if(j>i && b.reduce((s,v,k)=>s+(v!==c[k]),0)===1) edges.push([i,j]);
  }));
  function lines(vertices, colour, name, width) {
    const xyz=[[],[],[]];
    edges.forEach(([i,j])=>xyz.forEach((a,d)=>a.push(vertices[i][d],vertices[j][d],null)));
    return {type:'scatter3d',mode:'lines',x:xyz[0],y:xyz[1],z:xyz[2],
      line:{color:colour,width:width},name:name,hoverinfo:'skip'};
  }
  function faces() {
    const i=[],j=[],k=[];
    for(let d=0;d<3;d++) for(let value=0;value<2;value++) {
      const other=[0,1,2].filter(v=>v!==d);
      const ids=[[0,0],[1,0],[1,1],[0,1]].map(pair=>bits.findIndex(b=>
        b[d]===value && b[other[0]]===pair[0] && b[other[1]]===pair[1]));
      i.push(ids[0],ids[0]);j.push(ids[1],ids[2]);k.push(ids[2],ids[3]);
    }
    return {type:'mesh3d',x:primitive.map(v=>v[0]),y:primitive.map(v=>v[1]),z:primitive.map(v=>v[2]),
      i:i,j:j,k:k,color:'#ed8b2c',opacity:.12,flatshading:true,
      hoverinfo:'skip',showlegend:false,visible:true};
  }
  function mount(root,P) {
    if(root.dataset.bccAlternativeReady) return;
    root.dataset.bccAlternativeReady='true';
    root.style.cssText+=';width:100%;max-width:900px;margin:1rem auto;background:white;color:#222;font-family:Arial,sans-serif;';
    root.innerHTML=`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:8px">
      <button type="button" data-action="play">Pause rotation</button>
      <button type="button" data-action="reset">Reset view</button>
      <label>Speed <input data-role="speed" type="range" min="0" max="60" step="1" value="15" aria-label="Rotation speed in degrees per second"></label>
      <label><input data-role="cube" type="checkbox" checked> Conventional cube</label>
      <label><input data-role="faces" type="checkbox" checked> Shaded primitive cell</label>
      </div><div data-role="plot" style="width:100%;height:560px" role="img" aria-label="Rotating BCC lattice with the alternative primitive-cell frame"></div>
      <p style="text-align:center;font-size:14px">Grey: conventional cubic cell. Orange: alternative primitive cell.<br>
      v₁ = a î, v₂ = a ĵ, v₃ = (a/2)(î + ĵ + k̂).<br>The primitive cell extends into neighbouring cubes.<br>
      Drag to rotate manually (pauses animation); scroll to zoom.</p>`;
    const plot=root.querySelector('[data-role="plot"]');
    const play=root.querySelector('[data-action="play"]');
    const speed=root.querySelector('[data-role="speed"]');
    const atoms=[...bits,[.5,.5,.5]];
    primitive.forEach(p=>{if(!atoms.some(q=>q.every((v,d)=>v===p[d]))) atoms.push(p);});
    const traces=[lines(bits,'#7b8794','Conventional cube',4),
      lines(primitive,'#dd681b','Primitive cell',6),faces(),
      {type:'scatter3d',mode:'markers',x:atoms.map(v=>v[0]),y:atoms.map(v=>v[1]),z:atoms.map(v=>v[2]),
        marker:{size:10,color:'#3979b8',line:{color:'#19466b',width:1}},name:'Lattice points',
        hovertemplate:'(%{x}a, %{y}a, %{z}a)<extra></extra>'}];
    let theta=Math.PI/6, radius=2.2, height=1.15, centre={x:0,y:0,z:0};
    let running=!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let busy=false,last=0,request=0,disposed=false;
    const camera=()=>({eye:{x:radius*Math.cos(theta),y:radius*Math.sin(theta),z:height},
      center:centre,up:{x:0,y:0,z:1},projection:{type:'orthographic'}});
    const axis=title=>({title:{text:title},range:[-.2,1.7],visible:false});
    const layout={margin:{l:0,r:0,t:10,b:10},paper_bgcolor:'white',
      legend:{orientation:'h',x:.5,xanchor:'center',y:1},
      scene:{xaxis:axis('x/a'),yaxis:axis('y/a'),zaxis:axis('z/a'),
        aspectmode:'cube',camera:camera(),dragmode:'orbit'}};
    function sync(){play.textContent=running?'Pause rotation':'Start rotation';play.setAttribute('aria-pressed',String(running));}
    function pause(){running=false;sync();}
    function tick(now){
      if(disposed) return;
      if(!root.isConnected){disposed=true;if(observer)observer.disconnect();P.purge(plot);return;}
      if(running && !busy && !document.hidden && now-last>=50){
        const rect=root.getBoundingClientRect();
        if(rect.bottom>0 && rect.top<window.innerHeight){
          const dt=last?Math.min((now-last)/1000,.15):0;
          theta+=Number(speed.value)*Math.PI/180*dt;
          busy=true;
          Promise.resolve(P.relayout(plot,{'scene.camera':camera()})).catch(pause).finally(()=>{busy=false;});
        }
        last=now;
      }else if(!running || document.hidden){last=now;}
      request=window.requestAnimationFrame(tick);
    }
    let observer=null;
    P.newPlot(plot,traces,layout,{responsive:true,displaylogo:false,scrollZoom:true}).then(()=>{
      sync();
      play.onclick=()=>{
        if(!running){
          const c=plot.layout.scene.camera;
          if(c && c.eye){theta=Math.atan2(c.eye.y,c.eye.x);radius=Math.hypot(c.eye.x,c.eye.y);height=c.eye.z;centre=c.center||centre;}
        }
        running=!running;last=0;sync();
      };
      plot.addEventListener('pointerdown',pause);
      plot.addEventListener('wheel',pause,{passive:true});
      root.querySelector('[data-action="reset"]').onclick=()=>{
        theta=Math.PI/6;radius=2.2;height=1.15;centre={x:0,y:0,z:0};
        P.relayout(plot,{'scene.camera':camera()});
      };
      root.querySelector('[data-role="cube"]').onchange=e=>P.restyle(plot,{visible:e.target.checked},[0]);
      root.querySelector('[data-role="faces"]').onchange=e=>P.restyle(plot,{visible:e.target.checked},[2]);
      if(window.ResizeObserver){observer=new ResizeObserver(()=>P.Plots.resize(plot));observer.observe(root);}
      request=window.requestAnimationFrame(tick);
    }).catch(e=>{root.textContent='BCC visualisation: '+e.message;});
  }
  function init(){
    const roots=Array.from(document.querySelectorAll(SELECTOR));
    if(!roots.length)return;
    library().then(P=>roots.forEach(root=>mount(root,P))).catch(e=>roots.forEach(root=>{root.textContent=e.message;}));
  }
  // Call this again if BookML inserts a new container after page load.
  window.initialiseBCCAlternativeWidgets=init;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
