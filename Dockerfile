FROM zaproxy/zap-stable AS zap

FROM mcr.microsoft.com/playwright:v1.61.1-jammy

ENV TZ="Europe/London"
ENV CI=true

USER root

# System dependencies needed by tests and tools (curl/zip/Java)
RUN apt-get update -qq \
    && apt-get install -qqy \
    curl \
    zip \
    openjdk-17-jre-headless

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

# ZAP daemon for the security profile (see zap/README.md, entrypoint.sh) —
# reuses the same image already proven locally, rather than a second install
# mechanism.
COPY --from=zap --chown=pwuser:pwuser /zap /zap
ENV PATH="/zap:${PATH}"

WORKDIR /app

# Install Node dependencies from lockfile; skip lifecycle scripts for security
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy the rest of the project
COPY . .

# Use the non-root Playwright user provided by the base image
RUN chown -R pwuser:pwuser /app
USER pwuser

ENTRYPOINT [ "./entrypoint.sh" ]

# AWS CLI v2 is linux/amd64; on Apple Silicon build with:
#   docker build --platform=linux/amd64 .
