"""Restauração da planta da Fundac por processamento de imagem (sem IA generativa).
Não move nenhum pixel de lugar: só corrige fundo, contraste e nitidez."""
import cv2, numpy as np, sys
im=cv2.imread('original.jpeg'); h,w=im.shape[:2]
hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
Hh,Sa,V=cv2.split(hsv)
# mesa fora do papel (borda direita) -> branco
escuro=(V<110).astype(np.uint8)
n,lab,st,_=cv2.connectedComponentsWithStats(escuro)
fora=np.zeros((h,w),np.uint8)
for i in range(1,n):
    x,y,ww,hh,a=st[i]
    if x+ww>=w-1 and a>800: fora[lab==i]=255
fora=cv2.dilate(fora,np.ones((7,7),np.uint8))
# pixels de papel: claros, sem cor, e não fazem parte de traço (mais claros que o entorno)
local=cv2.dilate(V,np.ones((5,5),np.uint8))
papel=((Sa<45)&(V>120)&(V>=local.astype(np.int16)-18)&(fora==0)).astype(np.float32)
f=im.astype(np.float32)
def suave(x,s): return cv2.GaussianBlur(x,(0,0),s)
peso=suave(papel,25)
bg=np.dstack([suave(f[...,c]*papel,25)/np.maximum(peso,1e-3) for c in range(3)])
# onde quase não há papel por perto (dentro de áreas coloridas grandes), usa escala maior
peso2=suave(papel,70)
bg2=np.dstack([suave(f[...,c]*papel,70)/np.maximum(peso2,1e-3) for c in range(3)])
k=np.clip(peso/0.25,0,1)[...,None]
bg=bg*k+bg2*(1-k)
norm=np.clip(f/np.maximum(bg,1)*255,0,255)
# fundo branco uniforme: o que é quase branco e sem cor vira branco
mx=norm.max(axis=2); mn=norm.min(axis=2)
branco=(mn>232)&((mx-mn)<24)
norm[branco]=255
# contraste dos traços
norm=np.clip((norm-10)*(255/(255-10)),0,255)
out=norm.astype(np.uint8); out[fora>0]=255
big=cv2.resize(out,None,fx=2,fy=2,interpolation=cv2.INTER_LANCZOS4)
blur=cv2.GaussianBlur(big,(0,0),1.5)
sharp=cv2.addWeighted(big,1.6,blur,-0.6,0)
cv2.imwrite('planta-restaurada.png',sharp,[cv2.IMWRITE_PNG_COMPRESSION,9])
s=sharp.astype(np.float32); mx=s.max(axis=2); mn=s.min(axis=2)
alpha=np.clip(np.maximum((255-mx)*2.4,(mx-mn)*2.2)-14,0,255).astype(np.uint8)
cv2.imwrite('planta-transparente.png',np.dstack([sharp,alpha]),[cv2.IMWRITE_PNG_COMPRESSION,9])
a=im; b=cv2.resize(sharp,(w,h),interpolation=cv2.INTER_AREA)
cv2.imwrite('antes-depois.jpg',np.hstack([a,b]),[cv2.IMWRITE_JPEG_QUALITY,85])
cv2.imwrite('zoom.jpg',np.vstack([np.hstack([cv2.resize(im[60:260,100:420],(640,400),interpolation=cv2.INTER_CUBIC), sharp[120:520,200:840]]),
  np.hstack([cv2.resize(im[520:640,660:840],(360,240),interpolation=cv2.INTER_CUBIC), sharp[1040:1280,1320:1680], cv2.resize(im[740:870,520:660],(280,260))[:240], sharp[1480:1720,1040:1320]])]))
