import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import ThemedMixin, { theme } from '@dojo/framework/widget-core/mixins/Themed';
import { tsx } from '@dojo/framework/widget-core/tsx';

import * as css from './Grid.m.css';

@theme(css)
export default class Grid extends ThemedMixin(WidgetBase) {
	protected render() {
		return (
			<div data-test="grid" classes={this.theme(css.root)}>
				{this.children}
			</div>
		);
	}
}
