import Block from '@dojo/framework/widget-core/meta/Block';
import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { tsx } from '@dojo/framework/widget-core/tsx';

import * as css from './Blog.m.css';
import { BlogEntry, processContentDirectoryAsBlog } from '../scripts/blog';

export default class Blog extends WidgetBase {
	protected render() {
		const blog = (this.meta(Block).run(processContentDirectoryAsBlog('blog'))() as any) as BlogEntry[]
		// const blog = (this.meta(Block).run((...x: any[]) => {
		// 	console.log('meta run', x);
		// 	return [{ title : 'blah'}];
		// })() as any) as BlogEntry[];

		return (
			<div>
				<h1 classes={[css.root]}>Blog</h1>
				{ blog &&
					blog.slice(0, 1).map((entry) => {
						return (
							<article>
								<h2>{entry.title}</h2>
							</article>
						);
					})}
			</div>
		);
	}
}
