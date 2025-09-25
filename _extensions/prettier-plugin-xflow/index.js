import htmlPlugin from 'prettier/plugins/html.js';
const htmlParser = htmlPlugin.parsers.html;

function parse(text, parsers, options) {
  const pre = text.replace(
    /<x-flow([^>]*)>([\s\S]*?)<\/x-flow>/g,
    '<script type="x-flow"$1>$2</script>'
  );
  return htmlParser.parse(pre, { ...options, plugins: [] });
}

export const parsers = {
  'xflow-html': {
    ...htmlParser,
    parse,
    astFormat: 'html',
    // postprocess runs on final string
    postprocess: (results) => {
      //TODO: why is this not working???
      console.log('results', results);
      // results is usually an array with a single formatted string
      const out = Array.isArray(results) ? results.join('') : results;
      //   return out.replace(
      //     /<script\s+type="x-flow"([^>]*)>([\s\S]*?)<\/script>/g,
      //     (_m, attrs, content) => `<x-flow${attrs}>${content}</x-flow>`
      //   );
      return 'DANG';
    },
  },
};
