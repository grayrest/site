import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { tsx } from '@dojo/framework/widget-core/tsx';
import ThemedMixin, { theme, ThemedProperties } from '@dojo/framework/widget-core/mixins/Themed';

import * as css from './LandingSubsection.m.css';

interface LandingSubsectionProperties extends ThemedProperties {
	title?: string;
}

@theme(css)
export default class LandingSubsection extends ThemedMixin(WidgetBase)<LandingSubsectionProperties> {
	protected render() {
		const { title } = this.properties;

		return (
			<div key="landingSubsection" classes={this.theme(css.root)}>
				{title && <h2>{title}</h2>}
				{this.children}
			</div>
		);
	}
}
