import * as prettier from 'prettier';
import htmlPlugin from 'prettier/plugins/html.js';
const htmlParser = htmlPlugin.parsers.html;
const htmlPrinter = htmlPlugin.printers.html;

// 1) Preprocess + mark root
function parse(text, _parsers, options) {
  const pre = text.replace(
    /<x-flow([^>]*)>([\s\S]*?)<\/x-flow>/g,
    '<script type="x-flow"$1>$2</script>'
  );
  const ast = htmlParser.parse(pre, { ...options, plugins: [] });
  ast.__xflowRoot = true; // mark root so we know when to stringify
  return ast;

  //   // Step 1. Preprocess
  //   const pre = text.replace(
  //     /<x-flow([^>]*)>([\s\S]*?)<\/x-flow>/g,
  //     '<script type="x-flow"$1>$2</script>'
  //   );

  //   // Step 2. Let Prettier handle normal HTML formatting
  //   const formatted = prettier.format(pre, {
  //     ...options,
  //     parser: 'html',
  //   });

  //   // Step 3. Postprocess
  //   return formatted.replace(
  //     /<script\s+type="x-flow"([^>]*)>([\s\S]*?)<\/script>/g,
  //     (_m, attrs, content) => `<x-flow${attrs}>${content}</x-flow>`
  //   );
}

// 2) Parser: custom name + custom astFormat (binds to our printer)
export const parsers = {
  'xflow-html': {
    ...htmlParser,
    parse,
    astFormat: 'xflow-html',
  },
};

export const printers = {
  'xflow-html': {
    ...htmlPrinter,

    print(path, options, print) {
      const node = path.getValue();

      // Detect <script type="x-flow"> nodes
      console.log('node', node);
      if (
        node &&
        node.name === 'script' &&
        Array.isArray(node.attrs) &&
        node.attrs.some((a) => a.name === 'type' && a.value === 'x-flow')
      ) {
        node.name = 'x-flow';
        node.attrs = node.attrs.filter((a) => a.name !== 'type');
      }

      // Otherwise, delegate to normal HTML printer
      return htmlPrinter.print(path, options, print);
    },
  },
};

// function stringifyDoc(doc, options) {
//   // Strip down to only what Prettier's internal printer expects
//   const base = {
//     ...options,
//     parser: 'html',
//   };
//   return prettier.__debug.printDocToString(doc, base).formatted;
// }

// 3) Printer: delegate normally; only at root stringify and swap back
// export const printers = {
//   'xflow-html': {
//     print: (path, options, print) => path.getValue(),
//     ...htmlPrinter,
//     print(path, options, print) {
//       const doc = htmlPrinter.print(path, options, print);
//       const node = path && path.getValue ? path.getValue() : null;
//       if (node && node.__xflowRoot) {
//         const out = stringifyDoc(doc, options);
//         return out.replace(
//           /<script\s+type="x-flow"([^>]*)>([\s\S]*?)<\/script>/g,
//           (_m, attrs, content) => `<x-flow${attrs}>${content}</x-flow>`
//         );
//       }
//       return doc; // for non-root nodes return Doc, not string
//     },
//   },
// };
