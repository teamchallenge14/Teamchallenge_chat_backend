export const SWAGGER_CUSTOM_CSS = `
  .swagger-ui .info .description code {
    color: #15803d !important;
    background: #ecfdf5 !important;
    border: 1px solid #bbf7d0 !important;
    padding: 1px 4px;
    border-radius: 4px;
  }

  .swagger-ui .markdown,
  .swagger-ui .renderedMarkdown {
    line-height: 1.75 !important;
  }

  .swagger-ui .markdown p,
  .swagger-ui .markdown li,
  .swagger-ui .markdown td,
  .swagger-ui .markdown th,
  .swagger-ui .renderedMarkdown p,
  .swagger-ui .renderedMarkdown li,
  .swagger-ui .renderedMarkdown td,
  .swagger-ui .renderedMarkdown th {
    line-height: 1.75 !important;
  }

  .swagger-ui .markdown li,
  .swagger-ui .renderedMarkdown li {
    margin-bottom: 0.18em;
  }

  .swagger-ui .markdown code,
  .swagger-ui .renderedMarkdown code {
    color: #15803d !important;
    background: #ecfdf5 !important;
    border: 1px solid #bbf7d0 !important;
    line-height: 1.55 !important;
    padding: 0.14em 0.38em;
    border-radius: 0.3em;
    vertical-align: baseline;
  }

  .swagger-ui .markdown details summary,
  .swagger-ui .renderedMarkdown details summary {
    line-height: 1.75 !important;
  }

  .swagger-ui ::selection,
  .swagger-ui *::selection,
  .swagger-ui ::-moz-selection,
  .swagger-ui *::-moz-selection {
    background: #d9f7df;
    color: inherit;
  }
`;
