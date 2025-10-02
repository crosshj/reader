import { defineConfig } from 'vite';
import { resolve } from 'path';
import { writeFileSync, readFileSync, existsSync, renameSync } from 'fs';
import { minify } from 'terser';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'index.js'),
			name: 'XFramework',
			fileName: () => 'htmlNext.js',
			formats: ['es'],
		},
		// Force full minification for both ES and UMD
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: false, // Keep console.log for debugging
				drop_debugger: true,
				pure_funcs: ['console.log'], // Remove console.log in production
			},
			mangle: {
				toplevel: true, // Mangle top-level names
			},
			format: {
				comments: false, // Remove all comments
			},
		},
		cssCodeSplit: false,
		sourcemap: true,
		assetsDir: '',
		rollupOptions: {
			external: [],
			output: {
				globals: {},
				assetFileNames: (assetInfo) => {
					if (assetInfo.name && assetInfo.name.endsWith('.css')) {
						return 'htmlNext.css';
					}
					return assetInfo.name;
				},
			},
		},
	},
	plugins: [
		{
			name: 'minify-es-module',
			async writeBundle() {
				// Post-process the ES module to fully minify it
				const esModulePath = resolve(__dirname, 'dist/htmlNext.js');
				const code = readFileSync(esModulePath, 'utf8');

				const result = await minify(code, {
					compress: {
						drop_console: false,
						drop_debugger: true,
						passes: 2, // Multiple passes for better compression
					},
					mangle: {
						toplevel: true,
						properties: {
							regex: /^_/, // Mangle properties starting with _
						},
					},
					format: {
						comments: false,
					},
				});

				if (result.error) {
					console.error('Terser error:', result.error);
				} else {
					writeFileSync(esModulePath, result.code);
					console.log('✅ ES module fully minified');
				}
			},
		},
	],
	optimizeDeps: {
		include: [],
	},
});
