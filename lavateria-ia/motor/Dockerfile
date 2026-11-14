# Motor de visão do piloto da Lavateria Fast Bezerros. Só CPU (a VPS não
# tem GPU): torch do índice CPU, pesos do RF-DETR Nano baixados no build.
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch torchvision
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "import rfdetr; rfdetr.RFDETRNano(device='cpu')"

COPY *.py ./
ENV PYTHONUNBUFFERED=1
CMD ["python", "motor.py"]
