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

COPY *.py ./
ENV PYTHONUNBUFFERED=1
CMD ["python", "motor.py"]
