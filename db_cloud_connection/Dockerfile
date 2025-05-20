# db_cloud_connection/Dockerfile
FROM python:3.13

WORKDIR /app

# Copy requirements.txt from project root
COPY requirements.txt .

# Copy the backend source
COPY db_cloud_connection/ .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000
CMD ["python", "api.py"]