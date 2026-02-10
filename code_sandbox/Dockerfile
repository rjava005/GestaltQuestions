FROM python:3.11-slim
WORKDIR /app

RUN mkdir -p /app/tmp && chmod -R 777 /app/tmp
# Install dependencies for building Python packages
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    libpq-dev \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install mathjs globally
RUN npm install mathjs

# Local install inside /app (your working directory)
WORKDIR /app
# # Copy package.json files into the code_wrokspace image
COPY package.json package-lock.json ./
# Install node modules inside this image
RUN npm install
RUN npm install mathjs
# Install Poetry
RUN pip install --no-cache-dir poetry



# Poetry dependencies first for caching
COPY pyproject.toml poetry.lock* ./

# Configure Poetry and install dependencies 
RUN poetry config virtualenvs.create false \
    && poetry install --no-root --no-interaction --no-ansi

# Create non-root user
RUN useradd -ms /bin/bash sandbox
USER sandbox

# Copy all project files
COPY . .

EXPOSE 8080

CMD ["uvicorn", "code_sandbox.api.main:app","--reload", "--host", "0.0.0.0", "--port", "8080","--forwarded-allow-ips", "*"]
