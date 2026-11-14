# Motor de visão do piloto da Lavateria Fast Bezerros. Só CPU (a VPS não
# tem GPU): torch do índice CPU, pesos do RF-DETR Nano baixados no build.
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch torchvision
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Pesos do RF-DETR Nano + exportação para ONNX (o OpenVINO roda esse arquivo).
RUN python -c "from rfdetr import RFDETRNano; RFDETRNano(device='cpu').export(output_dir='/app/modelo')" > /tmp/export.log 2>&1 \
    && ls -la /app/modelo/*.onnx
# Atributos: modelos da Intel (Open Model Zoo, Apache 2.0) e pesos do CLIP ViT-B-16.
RUN mkdir -p /app/modelo/omz && cd /app/modelo/omz \
    && for m in person-attributes-recognition-crossroad-0230 vehicle-attributes-recognition-barrier-0039; do \
         for e in xml bin; do python -c "import urllib.request,sys; urllib.request.urlretrieve(sys.argv[1], sys.argv[2])" \
           https://storage.openvinotoolkit.org/repositories/open_model_zoo/2023.0/models_bin/1/$m/FP32/$m.$e $m.$e; done; done \
    && python -c "import open_clip; open_clip.create_model_and_transforms('ViT-B-16', pretrained='laion2b_s34b_b88k')"

COPY *.py ./
ENV PYTHONUNBUFFERED=1
CMD ["python", "motor.py"]
