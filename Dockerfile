# Chromium and all required Linux libraries come from the official Playwright image.
FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

COPY package.json package-lock.json ./
# The base image already includes Chromium, so do not run this project's postinstall download.
RUN npm ci --ignore-scripts

COPY . ./

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

EXPOSE 10000

CMD ["npm", "start"]
