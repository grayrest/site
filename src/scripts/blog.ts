import { Feed } from "feed";
import { fromMarkdown, toHyperscript } from './compile';
import { resolve, join } from 'path';
import { readFileSync } from 'fs';
import { outputFileSync } from 'fs-extra';

const unified = require('unified');
const remarkHtml = require('remark-html');

const manifest = require('../content/manifest.json');

export function processBlog() {
	const feed = new Feed({
		title: "Dojo",
		description: "The official blog of the Dojo framework",
		id: "https://dojo.io/blog",
		link: "https://dojo.io/blog",
		favicon: "https://dojo.io/favicon.ico",
		copyright: "All rights reserved 2019, SitePen",
		feedLinks: {
			atom: "https://dojo.io/atom"
		},
		author: {
			name: "SitePen"
		},
		feed: ''
	});

	for (const { path } of manifest.blog) {
		const workingPath = path.replace(/\.md$/, '');
		if (workingPath.length === path.length) {
			continue;
		}
		const fullPath = resolve(__dirname, join('..', 'content', path));
		const outputPath = `${workingPath}.ts`;

		const fileText = readFileSync(fullPath, 'utf-8');
		const processed = fromMarkdown(fileText);
		const { title, date, author, imageUrl, description } = processed.children[0].data.parsedValue;
		const content = unified().use(remarkHtml).runSync(processed);
		const hyperscript = toHyperscript(processed);
		const url = `https://dojo.io/${workingPath}`;

		// feed
		feed.addItem({
			title,
			id: url,
			author,
			link: url,
			image: imageUrl,
			description,
			content,
			date
		})

		// generated content
		const generatedPath = resolve('src', 'generated', outputPath);
		outputFileSync(generatedPath, `export default ${JSON.stringify(hyperscript)}`);

		console.info(` generated ${generatedPath}`);
	}
}
