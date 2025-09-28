# Framework Components

## x-viz-bar

- Responsive to container using CSS
- SVG-based rendering
- Scoped CSS in `viz-bar.css`
- Use CSS variables from framework.css
- Prefer `color-mix()` over new color definitions
- Accepts `data` attribute with array of objects
- Each object should have `value` and `label` properties
- Auto-scales based on data range

### Usage

```html
<x-data name="salesData"
	>[{"value": 10, "label": "Q1"}, {"value": 20, "label": "Q2"}, {"value": 30,
	"label": "Q3"}, {"value": 40, "label": "Q4"}]</x-data
>
<x-viz-bar data="global_salesData"></x-viz-bar>
```

## x-viz-pie

- Responsive to container using CSS
- SVG-based rendering
- Scoped CSS in `viz-pie.css`
- Use CSS variables from framework.css
- Prefer `color-mix()` over new color definitions
- Accepts `data` attribute with array of objects
- Each object should have `value` and `label` properties
- Auto-calculates percentages and angles

### Usage

```html
<x-data name="pieData">
	[ {"value": 30, "label": "A"}, {"value": 50, "label": "B"}, {"value": 20,
	"label": "C"} ]
</x-data>
<x-viz-pie data="global_pieData"></x-viz-pie>
```

## x-markdown

- Renders markdown content as HTML
- Scoped CSS in `markdown.css`
- Use CSS variables from framework.css
- Prefer `color-mix()` over new color definitions
- Accepts markdown content as innerHTML
- Supports standard markdown syntax (headers, lists, links, code blocks)
- Sanitizes HTML for security

### Usage

```html
<x-markdown>
	## Welcome to the Framework This is **bold** text and this is *italic*. - List
	item 1 - List item 2 [Link to example](https://example.com)
</x-markdown>
```
