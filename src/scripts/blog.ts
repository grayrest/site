import { Feed } from "feed";
import { fromMarkdown, toHyperscript } from './compile';
import { resolve, join } from 'path';
import { readFileSync } from 'fs';
import { outputFileSync, ensureFileSync } from 'fs-extra';
import * as walkSync from 'klaw-sync';
import { DNode } from '@dojo/framework/widget-core/interfaces';

const unified = require('unified');
const stringify = require('rehype-stringify');

const projectRootDir = resolve(__dirname, '..', '..');
const defaultContentRoot = join(projectRootDir, 'content');
const defaultOutputRoot = join(projectRootDir, 'output', 'dist');

export interface BlogEntry {
	title: string;
	author: string;
	link: string;
	image: string;
	description: string;
	content: DNode;
	date: Date;
}

export function processContentDirectoryAsBlog(path = 'blog', contentRoot = defaultContentRoot, outputDirectory = defaultOutputRoot) {
	const baseDir = join(contentRoot, path);
	const files = walkSync(baseDir).map(({path}) => path).filter(p => p.endsWith('md'));
	return () => processBlog(files, contentRoot, outputDirectory);
}

const sortDateDesc = (a: {date: Date}, b: {date: Date}) => b.date.getTime() - a.date.getTime();

export function processBlog(pathList: string[], contentRoot = defaultContentRoot, outputDirectory = defaultOutputRoot): BlogEntry[] {
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

	const toReturn = [];

	for (const path of pathList) {
		const fullPath = resolve(path);
		if (!(path.startsWith(contentRoot) && path.endsWith('md'))) {
			continue;
		}
		const workingPath = fullPath.slice(contentRoot.length).replace('.md', '');
		const outputPath = `${workingPath}.ts`;

		const fileText = readFileSync(fullPath, 'utf-8');
		const processed = fromMarkdown(fileText);
		const { title, date, author, imageUrl, description } = processed.data.frontmatter;
		const content = unified().use(stringify).stringify(processed);
		const hyperscript = toHyperscript(processed);
		const url = `https://dojo.io/${workingPath}`;
		const item = {
			title,
			id: url,
			author,
			link: url,
			image: imageUrl,
			description,
			content,
			date
		};

		// feed
		feed.addItem(item);
		toReturn.push({...item, content: hyperscript});

		// generated content
		const generatedPath = join(outputDirectory, outputPath);
		ensureFileSync(generatedPath);
		outputFileSync(generatedPath, `export default ${JSON.stringify(hyperscript)}`);

		console.info(` generated ${generatedPath}`);
	}
	feed.items.sort(sortDateDesc)
	toReturn.sort(sortDateDesc);

	const feedOutputPath = join(outputDirectory, 'atom.xml');
	outputFileSync(feedOutputPath, feed.atom1());
	console.info(` generated ${feedOutputPath}`);

	return toReturn;
}
