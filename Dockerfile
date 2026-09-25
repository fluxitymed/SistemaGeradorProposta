# Chromium and all required Linux libraries come from the official Playwright image.
# The tag exactly matches playwright and playwright-core in package-lock.json.
FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

COPY --chown=pwuser:pwuser package.json package-lock.json ./
# The base image already includes Chromium, so do not run this project's postinstall download.
RUN npm ci --ignore-scripts

COPY --chown=pwuser:pwuser . ./

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

# The preinstalled browser is readable by pwuser; run the application as that
# unprivileged account and prove PDF generation works during the image build.
USER pwuser
RUN npm run test:docker

EXPOSE 10000

CMD ["npm", "start"]
