/*
  The space around the planets: the sky (nebulae + stars, all procedural) and SB-0, a black hole drawn by
  bending light rays around it (a Schwarzschild photon path, integrated step by step). The accretion disk,
  the photon ring and the image of the far side of the disk arching over the top all come out of that
  physics; nothing is painted on. Colours are written in linear space (the composer converts them).
*/

const SIMPLEX = `
vec3 m289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 m289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 perm(vec4 x){return m289(((x*34.0)+1.0)*x);}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=m289(i);
  vec4 p=perm(perm(perm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=1.79284291400159-0.85373472095314*vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm4(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*snoise(p); p=p*2.03+vec3(3.1,7.7,1.3); a*=0.5; } return s; }
vec3 hash33(vec3 p){ p=fract(p*vec3(0.1031,0.1030,0.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
`;

/** Sky colour for a direction (linear). Shared by the sky sphere and the lensed sky around SB-0. */
const SKY_FN = `
vec3 starLayer(vec3 d, float scale, float prob, float size, float t){
  vec3 q=d*scale; vec3 id=floor(q); vec3 f=fract(q);
  vec3 h=hash33(id);
  if(h.x>prob) return vec3(0.0);
  vec3 c=0.2+0.6*hash33(id+17.0);
  float dist=length(f-c);
  float b=smoothstep(size,0.0,dist);
  float tw=0.75+0.25*sin(t*(1.0+h.y*3.0)+h.z*40.0);
  vec3 tint=mix(vec3(1.0,0.82,0.62),vec3(0.7,0.82,1.0),h.y);
  tint=mix(vec3(1.0),tint,0.6);
  return tint*b*b*tw*(0.4+1.6*h.z);
}
vec3 skyColor(vec3 d, float t){
  d=normalize(d);
  // Milky Way: a tilted band with dust lanes
  vec3 bandN=normalize(vec3(0.3,1.0,0.25));
  float b=dot(d,bandN);
  float band=exp(-b*b*7.0);
  float n1=fbm4(d*3.0)*0.5+0.5;
  float n2=fbm4(d*7.0+11.0)*0.5+0.5;
  float n3=fbm4(d*1.4+3.0)*0.5+0.5;
  vec3 col=vec3(0.002,0.003,0.008);
  vec3 violet=vec3(0.13,0.06,0.26), teal=vec3(0.03,0.16,0.18), rose=vec3(0.25,0.05,0.12), dust=vec3(0.28,0.18,0.12);
  col+=mix(violet,teal,smoothstep(0.4,0.7,n1))*band*n1*0.85;
  col+=dust*pow(band,3.0)*smoothstep(0.45,0.8,n2)*0.7;
  col+=vec3(0.9,0.8,0.95)*pow(band,10.0)*smoothstep(0.5,0.85,n1)*0.18;
  col*=1.0-smoothstep(0.55,0.8,n2)*band*0.85;
  // two big nebulae away from the band
  vec3 c1=normalize(vec3(-0.7,0.25,-0.6)), c2=normalize(vec3(0.8,-0.15,0.45));
  col+=rose*exp(-pow(length(d-c1)*2.4,2.0))*smoothstep(0.35,0.8,n3)*1.1;
  col+=teal*1.1*exp(-pow(length(d-c2)*2.0,2.0))*smoothstep(0.3,0.75,n1);
  // stars: faint field, mid field, a few bright ones with a glow
  col+=starLayer(d,260.0,0.35,0.16,t)*0.35;
  col+=starLayer(d,120.0,0.25,0.12,t)*0.7;
  col+=starLayer(d,120.0,0.25,0.12,t)*band*0.6;
  vec3 q=d*28.0; vec3 id=floor(q); vec3 h=hash33(id);
  if(h.x<0.07){
    vec3 c=0.25+0.5*hash33(id+5.0); float dist=length(fract(q)-c);
    vec3 tint=mix(vec3(1.0,0.75,0.5),vec3(0.65,0.8,1.0),h.y);
    col+=tint*(0.00035/(dist*dist+0.00035))*0.9*(0.6+0.4*h.z);
  }
  return col;
}
`;

export const SKY_VERT = `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const SKY_FRAG = `
varying vec3 vDir;
uniform float uTime;
${SIMPLEX}
${SKY_FN}
void main(){ gl_FragColor = vec4(skyColor(vDir, uTime), 1.0); }`;

/** Full-screen pass: each pixel builds its own ray from the inverse view-projection. */
export const HOLE_VERT = `varying vec2 vNdc; void main(){ vNdc = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/**
 * SB-0. Drawn on a camera-facing quad that covers the region where light bends. For each pixel a ray
 * leaves the camera and is bent by gravity (units of the Schwarzschild radius rs). Crossing the disk
 * plane between uIn and uOut adds disk light (hotter and Doppler-boosted on the side that comes towards
 * us); falling inside rs is the shadow; escaping returns the lensed sky.
 */
export const HOLE_FRAG = `
varying vec2 vNdc;
uniform float uTime; uniform float uRs; uniform vec3 uCenter; uniform mat3 uBasis;
uniform float uIn; uniform float uOut; uniform float uBound;
uniform mat4 uInvViewProj; uniform float uDepth;
${SIMPLEX}
${SKY_FN}
vec3 blackbody(float t){
  // t 0..1 : deep red → orange → warm white → blue-white
  vec3 c=mix(vec3(0.55,0.08,0.01),vec3(1.0,0.38,0.06),smoothstep(0.0,0.35,t));
  c=mix(c,vec3(1.0,0.82,0.55),smoothstep(0.3,0.7,t));
  return mix(c,vec3(0.85,0.9,1.0),smoothstep(0.75,1.0,t));
}
void main(){
  vec4 wp=uInvViewProj*vec4(vNdc,1.0,1.0); wp/=wp.w;
  vec3 ro=uBasis*((cameraPosition-uCenter)/uRs);
  vec3 rd=normalize(uBasis*(wp.xyz-cameraPosition));
  // jump to the bounding sphere
  float bq=dot(ro,rd), cq=dot(ro,ro)-uBound*uBound, disc=bq*bq-cq;
  if(disc<0.0) discard;
  float t0=max(0.0,-bq-sqrt(disc));
  vec3 p=ro+rd*t0; vec3 v=rd;
  vec3 h=cross(p,v); float h2=dot(h,h);
  vec3 col=vec3(0.0); float a=0.0; bool hole=false;
  for(int i=0;i<220;i++){
    float r=length(p);
    if(r<1.0){ hole=true; break; }
    if(r>uBound*1.02 && dot(p,v)>0.0) break;
    float dt=clamp(0.07*r*r/(r+2.0),0.015,1.2);
    vec3 acc=-1.5*h2*p/pow(r,5.0);
    vec3 pn=p+v*dt;
    v=normalize(v+acc*dt);
    if(p.y*pn.y<0.0){
      float k=p.y/(p.y-pn.y);
      vec3 c=mix(p,pn,k);
      float rc=length(c.xz);
      if(rc>uIn && rc<uOut){
        float x=(rc-uIn)/(uOut-uIn);
        float phi=atan(c.z,c.x);
        float spin=uTime*2.2*pow(uIn/rc,1.5);
        float pa=phi+spin;
        // stretched along the orbit, so the gas reads as long arcs rather than blobs
        vec3 q=vec3(cos(pa)*1.6,sin(pa)*1.6,rc*3.2);
        float turb=fbm4(q)*0.5+0.5;
        float fine=fbm4(vec3(cos(pa)*4.0,sin(pa)*4.0,rc*11.0)+5.0)*0.5+0.5;
        float clumps=pow(turb,1.4)*(0.6+0.4*fine);
        float dens=smoothstep(0.0,0.06,x)*smoothstep(1.0,0.45,x)*(0.2+1.2*clumps);
        // Doppler beaming: orbit velocity vs the direction the light travels towards us
        vec3 orb=normalize(vec3(-c.z,0.0,c.x));
        float beta=clamp(sqrt(0.5/rc),0.0,0.7);
        float g=1.0/(1.0/sqrt(1.0-beta*beta)*(1.0+beta*dot(orb,v)));
        float grav=sqrt(max(0.0,1.0-1.0/rc));
        float temp=pow(uIn/rc,0.75);
        float boost=pow(g*grav,3.0);
        vec3 e=blackbody(clamp(temp*1.05*g*grav,0.0,1.0))*boost*(0.5+2.6*temp)*dens;
        float ea=clamp(dens*0.95,0.0,1.0);
        col+=(1.0-a)*e*0.55;
        a+=(1.0-a)*ea;
        if(a>0.995) break;
      }
    }
    p=pn;
  }
  float bend=acos(clamp(dot(rd,v),-1.0,1.0));
  if(hole){ a=1.0; }
  else {
    // lensed sky shows where light was bent noticeably; elsewhere the real sky behind shows through
    float lens=smoothstep(0.004,0.03,bend);
    vec3 sky=skyColor(transpose(uBasis)*v,uTime);
    col+=(1.0-a)*sky*lens;
    a+=(1.0-a)*lens;
  }
  gl_FragDepth=uDepth;   // sort against the drone and the ships as if it sat at the hole's centre
  gl_FragColor=vec4(col,a);
}`;

/** A camera-facing quad (uv 0..1). */
export const UV_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/**
 * The wormhole's mouth: a sphere that shows the far side. Looking into it, the sky around is pulled
 * into a bright rim and the centre glows with the light of SB-0's disk on the other end.
 */
export const MOUTH_FRAG = `
varying vec2 vUv;
uniform float uTime;
${SIMPLEX}
${SKY_FN}
void main(){
  vec2 p=vUv*2.0-1.0; float r=length(p);
  if(r>1.0) discard;
  float k=1.0-r;
  // the far side: warm light swirling, brighter at the centre
  float a=atan(p.y,p.x);
  vec3 q=vec3(cos(a+uTime*0.6)*2.0,sin(a+uTime*0.6)*2.0,r*6.0-uTime*1.5);
  float swirl=fbm4(q)*0.5+0.5;
  vec3 far=mix(vec3(0.9,0.42,0.12),vec3(1.0,0.9,0.75),smoothstep(0.4,1.0,k))*(0.4+1.6*pow(k,2.5))*(0.6+0.6*swirl);
  // stars dragged around the rim
  vec3 dir=normalize(vec3(p*(1.0+3.0*pow(r,6.0)),0.6));
  vec3 rim=skyColor(dir,uTime)*smoothstep(0.55,1.0,r)*2.5;
  float ring=exp(-pow((r-0.97)/0.025,2.0));
  vec3 col=mix(far,rim,smoothstep(0.6,0.95,r))+vec3(0.75,0.85,1.0)*ring*2.5;
  float alpha=smoothstep(1.0,0.97,r);
  gl_FragColor=vec4(col*alpha,alpha);
}`;

/** Inside the wormhole: a tunnel of light streaks rushing past, opening to a bright exit. */
export const WARP_FRAG = `
varying vec2 vUv;
uniform float uTime; uniform float uAspect; uniform float uFade; uniform float uExit;
${SIMPLEX}
void main(){
  vec2 p=(vUv*2.0-1.0)*vec2(uAspect,1.0);
  float r=length(p)+1e-3; float a=atan(p.y,p.x);
  float z=0.35/r+uTime*3.2;
  vec3 q=vec3(cos(a)*1.5,sin(a)*1.5,z);
  float n=fbm4(q)*0.5+0.5;
  float streak=pow(fbm4(vec3(cos(a)*7.0,sin(a)*7.0,z*0.35))*0.5+0.5,4.0);
  vec3 c1=vec3(0.25,0.18,0.65), c2=vec3(0.15,0.55,0.85), c3=vec3(1.0,0.75,0.5);
  vec3 col=mix(c1,c2,n)*pow(n,1.6)*0.9+vec3(0.85,0.9,1.0)*streak*2.0;
  col*=0.55+0.45*smoothstep(1.4,0.2,r);
  col*=smoothstep(0.02,0.35,r);
  // the exit grows at the end
  float exitGlow=exp(-r*r/(0.02+uExit*1.2))*(0.5+uExit*6.0);
  col+=c3*exitGlow;
  col*=uFade;
  gl_FragColor=vec4(col,uFade);
}`;
