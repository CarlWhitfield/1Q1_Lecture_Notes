/* BookML: <div id="argand-power-widget"></div>
   Load this script after the container. Plotly loads automatically if needed.
   Multiple instances: use class="argand-power-widget" instead of an id. */
(function(){
'use strict';
const selector='#argand-power-widget, .argand-power-widget, [data-argand-power-widget]';
function load(){
 if(window.Plotly)return Promise.resolve(window.Plotly);
 if(window.__argandLoader)return window.__argandLoader;
 return window.__argandLoader=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='https://cdn.plot.ly/plotly-2.35.2.min.js';
  s.onload=()=>resolve(window.Plotly);s.onerror=()=>{delete window.__argandLoader;reject(Error('Unable to load Plotly. Load it locally or check your connection.'));};document.head.appendChild(s);
 });
}
function element(tag,style,text){const e=document.createElement(tag);e.style.cssText=style||'';if(text!==undefined)e.textContent=text;return e;}
function fmt(x){return String(Number(x.toFixed(3)));}
async function mount(host){
 if(typeof host==='string')host=document.getElementById(host);
 if(!host)throw Error('Argand container not found.');
 if(host.__argandMounted)return;
 host.__argandMounted=true;
 try{
 const P=await load();
 const root=element('div','display:flex;flex-wrap:wrap;gap:12px;width:100%;box-sizing:border-box;padding:12px;background:white;color:#111;font:14px system-ui,Arial,sans-serif;align-items:flex-start;');
 const wrap=element('div','flex:1 1 360px;min-width:0;');
 const plot=element('div','width:100%;height:480px;border:1px solid #ddd;box-sizing:border-box;');wrap.appendChild(plot);
 const panel=element('div','flex:0 1 320px;max-width:100%;min-width:0;box-sizing:border-box;padding:12px;background:#f7f7f7;border-radius:6px;');
 function slider(label,min,max,step,value){
  const row=element('label','display:flex;align-items:center;gap:8px;margin:12px 0;font-size:13px;');
  const title=element('span','flex:0 0 115px;',label), input=element('input','flex:1;min-width:30px;width:100%;'), out=element('span','flex:0 0 48px;text-align:right;font-family:monospace;');
  Object.assign(input,{type:'range',min,max,step,value});input.setAttribute('aria-label',label);row.append(title,input,out);panel.appendChild(row);return {input,out};
 }
 const mag=slider('Magnitude |z|',0,3,.05,1),angle=slider('Angle theta (degrees)',0,360,5,45),power=slider('Power n',1,5,1,2);
 const legend=element('div','display:flex;gap:20px;margin:18px 0 10px;');
 [['z','#1e88e5'],['z\u207f','#e53935']].forEach(([name,color])=>{const item=element('span','color:'+color+';font-weight:600;',name);legend.appendChild(item);});
 const info=element('div','font-size:13px;line-height:1.7;overflow-wrap:anywhere;'),a=element('div'),b=element('div');info.append(a,b);panel.append(legend,info);root.append(wrap,panel);host.appendChild(root);
 let span=1,target=1,z=[0,0],zn=[0,0],n=2,raf=null,busy=false,pending=false,dead=false;
 function read(){
  const r=Number(mag.input.value),deg=Number(angle.input.value),t=deg*Math.PI/180;n=Number(power.input.value);
  z=[r*Math.cos(t),r*Math.sin(t)];zn=[r**n*Math.cos(n*t),r**n*Math.sin(n*t)];
  mag.out.textContent=r.toFixed(2);angle.out.textContent=deg+'\u00b0';power.out.textContent=n;
  a.textContent='z = ('+z.map(fmt).join(', ')+')';b.textContent='z^'+n+' = ('+zn.map(fmt).join(', ')+')';
  // Angle-independent extent based only on |z|; retain the minimum half-range of 1.
  target=Math.max(1,1.2*Math.max(r,r**n));
  if(target>2*span||target<.5*span)span=target;
 }
 function traces(){return [z,zn].map((p,i)=>({type:'scatter',mode:'lines+markers',x:[0,p[0]],y:[0,p[1]],name:i?'z^'+n:'z',line:{color:i?'#e53935':'#1e88e5',width:3},marker:{color:i?'#e53935':'#1e88e5',size:[0,9]},hovertemplate:(i?'z^'+n:'z')+' = (%{x:.3f}, %{y:.3f})<extra></extra>'}));}
 function layout(){
  const axis={range:[-span,span],autorange:false,gridcolor:'#eee',zeroline:true,zerolinecolor:'#333',zerolinewidth:1.5,fixedrange:true,nticks:9,constrain:'domain'};
  return {autosize:true,margin:{l:55,r:25,t:25,b:50},showlegend:false,paper_bgcolor:'white',plot_bgcolor:'white',font:{family:'Arial',size:12},xaxis:Object.assign({},axis,{title:{text:'Re'}}),yaxis:Object.assign({},axis,{title:{text:'Im'},scaleanchor:'x',scaleratio:1}),annotations:[z,zn].map((p,i)=>({xref:'x',yref:'y',axref:'x',ayref:'y',x:p[0],y:p[1],ax:0,ay:0,text:'',showarrow:true,arrowhead:3,arrowwidth:3,arrowsize:1.2,arrowcolor:i?'#e53935':'#1e88e5'}))};
 }
 const config={responsive:true,displayModeBar:false,scrollZoom:false};
 function request(){pending=true;if(raf===null&&!busy&&!dead)raf=requestAnimationFrame(render);}
 async function render(){
  raf=null;if(dead)return;busy=true;pending=false;
  span=.82*span+.18*target;
  if(Math.abs(span-target)<1e-4*Math.max(1,target))span=target;
  try{await P.react(plot,traces(),layout(),config);}catch(e){console.error(e);}finally{busy=false;}
  if(!dead&&(pending||span!==target))request();
 }
 read();span=target;
 await P.newPlot(plot,traces(),layout(),config);
 [mag,angle,power].forEach(s=>s.input.addEventListener('input',()=>{read();request();}));
 const resize=()=>{if(!dead)P.Plots.resize(plot);};let observer;
 if(window.ResizeObserver){observer=new ResizeObserver(resize);observer.observe(wrap);}else window.addEventListener('resize',resize);
 return {destroy(){dead=true;if(raf!==null)cancelAnimationFrame(raf);if(observer)observer.disconnect();else window.removeEventListener('resize',resize);P.purge(plot);root.remove();delete host.__argandMounted;}};
 }catch(error){delete host.__argandMounted;throw error;}
}
window.ArgandPowerPlotly={mount};
function init(){document.querySelectorAll(selector).forEach(host=>mount(host).catch(e=>{host.appendChild(element('p','color:#b00020;',e.message));console.error(e);}));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
