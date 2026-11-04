/*
  Procedural planets for SB-OS (and the Atlas page). One fragment shader draws a lit sphere with
  terrain, clouds, atmosphere, rings, an asteroid belt and up to four moons on a flat quad, so a
  planet costs one draw call and no textures. Shared by /play and the Atlas.
*/

export type World = {
  id: string; name: string; kind: string; kindEs: string; meaning: string; meaningEs: string;
  type: number; seed: number; pal: string[]; sea: number; scale: number; clouds: number; cloud: string;
  atmo: string; atmoS: number; caps?: number; lights?: number; emit?: string; emitS?: number;
  ring?: number; ringCol?: string; ringR?: [number, number]; storm?: number;
};

/** Options a project can set on top of its world. */
export type PlanetOptions = { moons: number; rings: 'none' | 'rings' | 'belt' | 'both' };

export const PLANET_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** Fragment body. Prefix it with a PLANET_UV define (see planetFragment). */
const FRAG_BODY = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uSeed; uniform float uSpinOffset;
uniform int uType;
uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;
uniform float uSea; uniform float uScale; uniform float uClouds; uniform vec3 uCloud;
uniform vec3 uAtmo; uniform float uAtmoS; uniform float uCaps; uniform float uLights;
uniform vec3 uEmit; uniform float uEmitS;
uniform float uRing; uniform vec3 uRingCol; uniform vec2 uRingR; uniform float uStorm;
uniform float uTilt;
uniform vec3 uLight;      // light direction in view space
uniform float uMoons;     // 0..4
uniform float uBelt;      // asteroid belt instead of / besides rings
uniform vec2 uBeltR;

// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*snoise(p); p=p*2.02+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
float fbm3(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<3;i++){ s+=a*snoise(p); p=p*2.03+vec3(5.1,1.3,7.7); a*=0.5; } return s; }

mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.0,-s, 0.0,1.0,0.0, s,0.0,c); }
mat3 rotZ(float a){ float c=cos(a), s=sin(a); return mat3(c,s,0.0, -s,c,0.0, 0.0,0.0,1.0); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,s, 0.0,-s,c); }

vec3 ramp(float t){
  t=clamp(t,0.0,1.0);
  if(t<0.25) return mix(uC0,uC1,t/0.25);
  if(t<0.5) return mix(uC1,uC2,(t-0.25)/0.25);
  if(t<0.75) return mix(uC2,uC3,(t-0.5)/0.25);
  return mix(uC3,uC4,(t-0.75)/0.25);
}

// crater field for rocky moons: cheap cellular noise
float craters(vec3 p){
  vec3 i=floor(p); vec3 f=fract(p); float res=0.0;
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){
    vec3 b=vec3(float(x),float(y),float(z));
    vec3 h=fract(sin(vec3(dot(i+b,vec3(127.1,311.7,74.7)),dot(i+b,vec3(269.5,183.3,246.1)),dot(i+b,vec3(113.5,271.9,124.6))))*43758.5453);
    vec3 r=b+h-f; float d=length(r); float rad=0.25+0.3*h.x;
    float bowl=smoothstep(rad,rad*0.2,d); float rim=smoothstep(rad*0.75,rad,d)*smoothstep(rad*1.25,rad,d);
    res+= -bowl*0.6 + rim*0.5;
  }
  return res;
}

float hash1(float n){ return fract(sin(n)*43758.5453123); }

// a small rocky moon, shaded with the same light
vec3 moonColor(vec3 n, float id, vec3 L){
  float h=snoise(n*3.0+id*13.1)*0.5+0.5;
  float c=craters(n*3.5+id*7.0)*0.15;
  vec3 base=mix(vec3(0.42,0.40,0.44),vec3(0.70,0.66,0.62),hash1(id*3.7));
  base=mix(base*0.7,base*1.15,h)+c;
  float wrap=smoothstep(-0.15,0.6,dot(n,L));
  return base*(0.03+0.97*wrap);
}

void main(){
  vec2 uv=PLANET_UV;
  float R = (uRing>0.0 || uBelt>0.0 || uMoons>0.0) ? 0.42 : 0.62;
  vec3 L=normalize(uLight);
  mat3 M = rotX(-0.38)*rotZ(uTilt);          // object orientation (view tilt + axial tilt)
  mat3 Mi = rotZ(-uTilt)*rotX(0.38);
  float spin = uTime*0.06 + uSpinOffset + uSeed*0.37;

  float r2=dot(uv,uv);
  vec4 outc=vec4(0.0);

  // atmosphere halo outside the disk
  float rr=sqrt(r2);
  if(rr>R){
    float g=exp(-(rr-R)/(R*0.05));
    float lit=clamp(dot(normalize(vec3(uv,0.25)),L)*0.8+0.35,0.0,1.0);
    float a=g*uAtmoS*0.55*lit;
    outc=vec4(uAtmo*a,a);
  }

  vec4 front=vec4(0.0); float frontZ=-10.0;   // nearest opaque thing (planet or a moon)
  if(r2<R*R){
    float z=sqrt(R*R-r2);
    vec3 n=vec3(uv,z)/R;
    vec3 sp = rotY(spin)*(Mi*n);          // surface coordinate
    vec3 q = sp*uScale + uSeed*3.71;
    float ndl=dot(n,L);
    float wrap=smoothstep(-0.18,0.55,ndl);
    vec3 col; float spec=0.0; vec3 emit=vec3(0.0);

    if(uType==5){
      // gas giant: warped latitude bands + storm
      float w=fbm(vec3(sp.x*1.3,sp.y*4.0,sp.z*1.3)+uSeed)*0.28;
      float lat=sp.y+w;
      float b1=sin(lat*uScale*1.0)*0.5+0.5;
      float b2=sin(lat*uScale*2.3+1.7)*0.5+0.5;
      float t=mix(b1,b2,0.45)+fbm3(vec3(sp.x*3.0,sp.y*14.0,sp.z*3.0))*0.12;
      col=ramp(t);
      if(uStorm>0.0){
        vec3 sc=normalize(vec3(0.75,-0.28,0.6));
        float d=length((sp-sc)*vec3(0.7,1.9,0.7));
        float swirl=snoise(sp*9.0+vec3(d*6.0))*0.5+0.5;
        float s=smoothstep(0.26,0.08,d);
        col=mix(col, mix(uC3,uC4,swirl), s*0.85);
      }
    } else {
      float h=fbm(q+0.6*vec3(fbm3(q*0.7),fbm3(q*0.7+4.0),0.0))*0.5+0.5;
      if(uType==4){
        h=h*0.5+0.25+craters(sp*4.0+uSeed)*0.18+craters(sp*9.0+uSeed*2.0)*0.08;
        col=ramp(h);
      } else if(uType==2){
        float crack=pow(1.0-abs(snoise(q*1.3)),10.0)+pow(1.0-abs(snoise(q*2.9+2.0)),14.0)*0.6;
        col=ramp(h*0.8);
        emit=uEmit*crack*uEmitS*(0.6+0.4*sin(uTime*1.3+h*20.0));
        col=mix(col,uEmit*0.5,crack*0.35);
      } else if(uType==1){
        float dunes=sin(sp.x*38.0+sp.z*12.0+fbm3(q*2.0)*7.0)*0.5+0.5;
        col=ramp(h*0.85+dunes*0.12);
      } else if(uType==3){
        if(h<uSea){ col=mix(uC0,uC1,smoothstep(uSea-0.3,uSea,h)); spec=0.6; }
        else { col=ramp(0.5+(h-uSea)/(1.0-uSea)*0.5); }
        float crev=pow(1.0-abs(snoise(q*2.6+1.0)),18.0);
        col=mix(col,uC0*1.1,crev*0.8);
      } else {
        if(h<uSea){ col=mix(uC0,uC1,smoothstep(uSea-0.28,uSea,h)); spec=1.0; }
        else {
          float t=(h-uSea)/max(0.001,1.0-uSea);
          col = t<0.35 ? mix(uC2,uC3,t/0.35) : mix(uC3,uC4,(t-0.35)/0.65);
          if(uLights>0.0){
            float city=smoothstep(0.62,0.9,snoise(q*9.0)*0.5+0.5)*smoothstep(0.0,0.15,t);
            emit+=vec3(1.0,0.78,0.42)*city*smoothstep(0.1,-0.25,ndl)*1.4;
          }
        }
      }
      if(uCaps>0.0){
        float cap=smoothstep(uCaps,uCaps+0.06,abs(sp.y)+(h-0.5)*0.3);
        col=mix(col,vec3(0.92,0.95,1.0),cap); spec*=1.0-cap;
      }
    }

    vec3 lit=col*(0.035+0.965*wrap);
    vec3 V=vec3(0.0,0.0,1.0);
    lit+=vec3(1.0,0.97,0.9)*pow(max(dot(reflect(-L,n),V),0.0),36.0)*0.55*spec*wrap;

    if(uClouds>0.0){
      float c=fbm(sp*2.6+vec3(uTime*0.012,0.0,uTime*0.008)+uSeed*1.3)*0.5+0.5;
      float ca=smoothstep(0.62-uClouds*0.28,0.9,c)*min(1.0,uClouds*1.3);
      lit=mix(lit, uCloud*(0.04+0.96*wrap), ca);
      emit*=1.0-ca*0.7;
    }
    lit+=emit;

    float fres=pow(1.0-n.z,2.4);
    lit+=uAtmo*fres*uAtmoS*(0.12+0.9*wrap)*0.85;
    front=vec4(lit,1.0); frontZ=z;
  }


  // moons
  for(int i=0;i<4;i++){
    if(float(i)>=uMoons) break;
    float fi=float(i);
    float a=R*(1.6+0.32*fi);
    float th=uTime*(0.22-0.035*fi)+hash1(uSeed+fi*7.0)*6.283;
    float inc=(hash1(uSeed*3.0+fi)-0.5)*0.35;
    vec3 c=M*(rotZ(inc)*vec3(a*cos(th),0.0,a*sin(th)));
    float mr=R*(0.09+0.05*hash1(uSeed+fi*1.7));
    vec2 d=uv-c.xy; float dd=dot(d,d);
    if(dd<mr*mr){
      float zm=c.z+sqrt(mr*mr-dd);
      if(zm>frontZ){
        vec3 nm=vec3(d,zm-c.z)/mr;
        // the planet's shadow on the moon
        float along=dot(c,L); float off=length(c-along*L);
        float sh=(along<0.0 && off<R) ? 0.12 : 1.0;
        front=vec4(moonColor(nm,fi+uSeed,L)*sh+uAtmo*pow(1.0-nm.z,3.0)*0.08,1.0); frontZ=zm;
      }
    }
  }
  if(front.a>0.0) outc=front;

  // rings and asteroid belt share the planet's equatorial plane
  vec3 N=M*vec3(0.0,1.0,0.0);
  if((uRing>0.0 || uBelt>0.0) && abs(N.z)>0.001){
    float t=-(uv.x*N.x+uv.y*N.y)/N.z;
    vec3 p=vec3(uv,t);
    float r=length(p)/R;
    float along=dot(p,L); float off=length(p-along*L);
    float sh=(along<0.0 && off<R) ? 0.15 : 1.0;
    if(t>frontZ){
      if(uRing>0.0 && r>uRingR.x && r<uRingR.y){
        float k=(r-uRingR.x)/(uRingR.y-uRingR.x);
        float bands=0.55+0.45*sin(r*90.0+snoise(vec3(r*30.0,uSeed,1.0))*2.0);
        float gap=smoothstep(0.52,0.55,k)*smoothstep(0.6,0.57,k);
        float a=smoothstep(0.0,0.04,k)*smoothstep(1.0,0.92,k)*bands*(1.0-gap*0.85)*0.75*uRing;
        vec3 rc=uRingCol*(0.25+0.75*sh)*(0.6+0.4*abs(dot(N,L)));
        outc.rgb=outc.rgb*(1.0-a)+rc*a; outc.a=outc.a+a*(1.0-outc.a);
      }
      if(uBelt>0.0 && r>uBeltR.x && r<uBeltR.y){
        // rocks: cells in (radius, angle) of the ring plane, one rock per lucky cell
        vec3 po=Mi*p;
        float ang=atan(po.z,po.x)+uTime*0.035;
        float lanes=7.0;
        float k=(r-uBeltR.x)/(uBeltR.y-uBeltR.x);
        float lane=floor(k*lanes);
        float cells=70.0+lane*14.0;
        float a01=fract(ang/6.2831853+0.5);
        float cell=floor(a01*cells);
        float id=lane*131.0+cell+uSeed*17.0;
        float occ=step(0.45,hash1(id));
        vec2 local=vec2(fract(a01*cells)-0.5, fract(k*lanes)-0.5);
        vec2 off2=vec2(hash1(id+1.3),hash1(id+2.7))-0.5;
        float rock=length((local-off2*0.6)*vec2(1.0,0.75));
        float rs=0.18+0.22*hash1(id+5.1);
        float m=smoothstep(rs,rs*0.55,rock)*occ;
        float dust=(0.08+0.06*snoise(vec3(r*40.0,a01*60.0,uSeed)))*smoothstep(0.0,0.15,k)*smoothstep(1.0,0.85,k);
        vec3 rc=mix(vec3(0.55,0.5,0.47),vec3(0.75,0.7,0.62),hash1(id+9.0))*(0.25+0.75*sh)*(0.55+0.45*(1.0-local.y));
        float a=clamp(m*0.95+dust*0.5,0.0,1.0)*uBelt;
        outc.rgb=outc.rgb*(1.0-a)+rc*a; outc.a=outc.a+a*(1.0-outc.a);
      }
    }
  }
  gl_FragColor=outc;
}`;

/** The fragment shader for a three.js quad (uv 0..1 across the quad). */
export const planetFragment = () => `varying vec2 vUv;\n#define PLANET_UV (vUv*2.0-1.0)\n${FRAG_BODY}`;
/** The fragment shader for a full-canvas draw (the Atlas page). */
export const canvasFragment = () => `#define PLANET_UV ((gl_FragCoord.xy/uRes)*2.0-1.0)\n${FRAG_BODY}`;
