FROM node:22-bookworm-slim AS web
WORKDIR /build
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM python:3.11-slim-bookworm
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 OMP_NUM_THREADS=2
COPY requirements.txt ./
RUN pip install --no-cache-dir torch==2.12.1 torchvision==0.27.1 --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home --uid 1000 appuser
COPY --chown=appuser:appuser api/ api/
COPY --chown=appuser:appuser utils/ utils/
COPY --chown=appuser:appuser models/ models/
COPY --from=web --chown=appuser:appuser /build/dist/ web/dist/
USER appuser
EXPOSE 7860
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7860/api/health', timeout=4)"
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1", "--limit-concurrency", "12", "--timeout-keep-alive", "5", "--no-access-log"]
