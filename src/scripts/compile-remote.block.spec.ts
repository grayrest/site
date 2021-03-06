import * as fetch from 'node-fetch';

import * as compiler from './compile';
import compilerBuild from './compile-remote.block';

describe('content compiler', () => {
	const githubContent = 'github page content';

	const registeredHandlers = {
		Alert: () => {},
		Aside: () => {},
		CodeBlock: () => {},
		CodeSandbox: () => {}
	};
	const mockRegisterHandlers = jest.spyOn(compiler, 'registerHandlers');
	const mockToDNodes = jest.spyOn(compiler, 'toDNodes');
	const mockFromMarkdown = jest.spyOn(compiler, 'fromMarkdown');
	const mockFetch = jest.spyOn(fetch, 'default');
	const mockText = jest.fn();

	beforeEach(() => {
		jest.resetAllMocks();

		mockRegisterHandlers.mockReturnValue(registeredHandlers);
		mockFetch.mockResolvedValue({
			text: mockText
		} as any);
		mockText.mockResolvedValue(Promise.resolve(githubContent));
		mockToDNodes.mockResolvedValue('page content');
	});

	it('should process', async () => {
		const expectedResult = 'page content';
		mockToDNodes.mockReturnValueOnce(expectedResult);

		const result = await compilerBuild({
			repo: 'dojo/framework',
			path: 'docs/:locale:/i18n/index.md',
			locale: 'en'
		});

		expect(result).toEqual(expectedResult);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://raw.githubusercontent.com/dojo/framework/master/docs/en/i18n/index.md'
		);
		expect(mockFromMarkdown).toHaveBeenCalledWith('github page content', registeredHandlers);
	});

	it('should process with different locale', async () => {
		const expectedResult = 'page content';
		mockToDNodes.mockReturnValueOnce(expectedResult);

		const result = await compilerBuild({
			repo: 'dojo/framework',
			path: 'docs/:locale:/i18n/index.md',
			locale: 'fr'
		});

		expect(result).toEqual(expectedResult);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://raw.githubusercontent.com/dojo/framework/master/docs/fr/i18n/index.md'
		);
		expect(mockFromMarkdown).toHaveBeenCalledWith('github page content', registeredHandlers);
	});

	it('should process with different branch', async () => {
		const expectedResult = 'page content';
		mockToDNodes.mockReturnValueOnce(expectedResult);

		const result = await compilerBuild({
			repo: 'dojo/framework',
			branch: 'branch',
			path: 'docs/:locale:/i18n/index.md',
			locale: 'en'
		});

		expect(result).toEqual(expectedResult);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://raw.githubusercontent.com/dojo/framework/branch/docs/en/i18n/index.md'
		);
		expect(mockFromMarkdown).toHaveBeenCalledWith('github page content', registeredHandlers);
	});

	it('should process without locale (defaulting to en-US)', async () => {
		const expectedResult = 'page content';
		mockToDNodes.mockReturnValueOnce(expectedResult);

		const result = await compilerBuild({
			repo: 'dojo/framework',
			path: 'docs/:locale:/i18n/index.md'
		});

		expect(result).toEqual(expectedResult);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://raw.githubusercontent.com/dojo/framework/master/docs/en/i18n/index.md'
		);
		expect(mockFromMarkdown).toHaveBeenCalledWith('github page content', registeredHandlers);
	});
});
