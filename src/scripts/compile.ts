import { v, w } from '@dojo/framework/widget-core/d';
import { DNode } from '@dojo/framework/widget-core/interfaces';
import { readFile, readFileSync } from 'fs-extra';
import { resolve } from 'path';

import { regionBuilder } from './regions/parser';

import linkCleanup from './link-cleanup';

const unified = require('unified');
const frontmatter = require('remark-frontmatter');
const macro = require('remark-macro')();
const remarkParse = require('remark-parse');
const toH = require('hast-to-hyperscript');
const remark2rehype = require('remark-rehype');
const rehypePrism = require('@mapbox/rehype-prism');
const all = require('mdast-util-to-hast/lib/all');
const parseFrontmatter = require('remark-parse-yaml');
const visit = require('unist-util-visit');

export interface Handler {
    type: string;
    inline?: boolean;
}

export interface UnifiedPoint {
    line: number;
    column: number;
    offset?: number;
}

export interface UnifiedNode {
    type: 'root' | 'yaml' | 'element' | 'text';
    children: UnifiedNode[];
    data?: any;
    position: {
        start: UnifiedPoint,
        end: UnifiedPoint,
        indent?: number[]
    }
}

export type HandlerFunction = (h: Function, node: any) => any;

export interface WidgetBuilders {
    [type: string]: WidgetBuilder;
}

export type WidgetBuilder = (type: string, props: any, children: any[]) => DNode;

export const handlers: Handler[] = [
    { type: 'Alert' },
    { type: 'Aside' },
    { type: 'CodeBlock', inline: true },
    { type: 'CodeSandbox', inline: true }
];

export const widgets: WidgetBuilders = {
    'docs-codeblock': regionBuilder
};

let key = 0;

export const pragma = (tag: string, props: any = {}, children: any[]) => {
    props.key = `compiled-${key++}`;
    if (tag.substr(0, 1) === tag.substr(0, 1).toUpperCase()) {
        const type = `docs-${tag.toLowerCase()}`;
        if (widgets[type]) {
            return widgets[type](type, props, children);
        }
        return w(type, props, children);
    }
    return v(tag, props, children);
};

export const registerHandlers = (types: Handler[]): { [type: string]: HandlerFunction } => {
    return types.reduce((handlers: { [type: string]: HandlerFunction }, { type, inline = false }) => {
        try {
            if (inline) {
                macro.addMacro(type, (props: any) => ({ type, props }), true);
            } else {
                macro.addMacro(
                    type,
                    (content: string, props: any, { transformer, eat }: { transformer: any; eat: any }) => {
                        return { type, props, children: transformer.tokenizeBlock(content, eat.now()) };
                    }
                );
            }
        } catch (err) {}

        if (inline) {
            handlers[type] = (h, node) => h(node, node.type, node.props);
        } else {
            handlers[type] = (h, node) => h(node, node.type, node.props, all(h, node));
        }
        return handlers;
    }, {});
};

const preserveFrontmatter = () => (ast: UnifiedNode, file: any) => {
	visit(ast, 'yaml', (item: UnifiedNode) => {
		file.data.frontmatter = item.data.parsedValue;
	})
};

const restoreFrontmatter = () => (ast: UnifiedNode, file: any) => {
	ast.data = { frontmatter: file.data.frontmatter };
}

export const fromMarkdown = (
    content: string,
    registeredHandlers?: { [type: string]: HandlerFunction }
): UnifiedNode => {
    if (!registeredHandlers) {
        registeredHandlers = registerHandlers(handlers);
    }
    const pipeline = unified()
        .use(remarkParse, { commonmark: true }) // markdown parser
		.use(frontmatter, 'yaml')   // extracts frontmatter
		.use(parseFrontmatter)      // converts frontmatter from text to an object
		.use(preserveFrontmatter)   // html conversion drops yaml nodes
        .use(macro.transformer)     // enables our custom directives
		.use(remark2rehype, { handlers: registeredHandlers }) // markdown nodes to html nodes
		.use(restoreFrontmatter)
        .use(linkCleanup)
        .use(rehypePrism, { ignoreMissing: false }); // syntax highlighting

    const nodes = pipeline.parse(content);
    return pipeline.runSync(nodes);
};

export const toHyperscript = (node: UnifiedNode): DNode => toH(pragma, node);

export const getLocalFile = async (path: string): Promise<string> => {
    path = resolve(__dirname, path);
    return await readFile(path, 'utf-8');
};

export const setLocale = (path: string, inputLocale: string) => {
    let locale = inputLocale;
    const localeMatch = /([a-z]+)-\S+/g.exec(locale);
    if (localeMatch && localeMatch.length === 2) {
        locale = localeMatch[1];
    }

    return path.replace(/:locale:/g, locale);
};

export const processMarkdown = (path: string, registeredHandlers?: { [type: string]: HandlerFunction }): DNode => {
    const content = readFileSync(resolve(__dirname, path), 'utf-8');
    return toHyperscript(fromMarkdown(content, registeredHandlers));
};
