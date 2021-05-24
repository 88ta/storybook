import { Component, getPlatform } from '@angular/core';
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { CanvasRenderer } from './CanvasRenderer';
import { RendererFactory } from './RendererFactory';
import { DocsRenderer } from './DocsRenderer';

jest.mock('@angular/platform-browser-dynamic');

declare const document: Document;
describe('RendererFactory', () => {
  let rendererFactory: RendererFactory;

  beforeEach(async () => {
    rendererFactory = new RendererFactory();
    document.body.innerHTML =
      '<div id="root"></div><div id="root-docs"><div id="story-in-docs"></div></div>';
    (platformBrowserDynamic as any).mockImplementation(platformBrowserDynamicTesting);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CanvasRenderer', () => {
    it('should get CanvasRenderer instance', () => {
      expect(
        rendererFactory.getRendererInstance('root', global.document.getElementById('root'))
      ).toBeInstanceOf(CanvasRenderer);
    });

    it('should add storybook-wrapper for story template', async () => {
      await rendererFactory
        .getRendererInstance('root', global.document.getElementById('root'))
        .render({
          storyFnAngular: {
            template: '🦊',
            props: {},
          },
          forced: false,
          parameters: {} as any,
        });

      expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe('🦊');
    });

    it('should add storybook-wrapper for story component', async () => {
      @Component({ selector: 'foo', template: '🦊' })
      class FooComponent {}

      await rendererFactory
        .getRendererInstance('root', global.document.getElementById('root'))
        .render({
          storyFnAngular: {
            props: {},
          },
          forced: false,
          parameters: {
            component: FooComponent,
          },
        });

      expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe(
        '<foo>🦊</foo>'
      );
    });

    describe('when forced=true', () => {
      beforeEach(async () => {
        // Init first render
        await rendererFactory
          .getRendererInstance('root', global.document.getElementById('root'))
          .render({
            storyFnAngular: {
              template: '{{ logo }}: {{ name }}',
              props: {
                logo: '🦊',
                name: 'Fox',
              },
            },
            forced: true,
            parameters: {} as any,
          });
      });

      it('should be rendered a first time', async () => {
        expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe(
          '🦊: Fox'
        );
      });

      it('should not be re-rendered when only props change', async () => {
        let countDestroy = 0;

        getPlatform().onDestroy(() => {
          countDestroy += 1;
        });
        // only props change
        await rendererFactory
          .getRendererInstance('root', global.document.getElementById('root'))
          .render({
            storyFnAngular: {
              props: {
                logo: '👾',
              },
            },
            forced: true,
            parameters: {} as any,
          });
        expect(countDestroy).toEqual(0);

        expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe(
          '👾: Fox'
        );
      });

      it('should be re-rendered when template change', async () => {
        await rendererFactory
          .getRendererInstance('root', global.document.getElementById('root'))
          .render({
            storyFnAngular: {
              template: '{{ beer }}',
              props: {
                beer: '🍺',
              },
            },
            forced: true,
            parameters: {} as any,
          });

        expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe('🍺');
      });

      it('should be re-rendered when moduleMetadata structure change', async () => {
        let countDestroy = 0;

        getPlatform().onDestroy(() => {
          countDestroy += 1;
        });

        // Only props change -> no full rendering
        await rendererFactory
          .getRendererInstance('root', global.document.getElementById('root'))
          .render({
            storyFnAngular: {
              template: '{{ logo }}: {{ name }}',
              props: {
                logo: '🍺',
                name: 'Beer',
              },
            },
            forced: true,
            parameters: {} as any,
          });
        expect(countDestroy).toEqual(0);

        // Change in the module structure -> full rendering
        await rendererFactory
          .getRendererInstance('root', global.document.getElementById('root'))
          .render({
            storyFnAngular: {
              template: '{{ logo }}: {{ name }}',
              props: {
                logo: '🍺',
                name: 'Beer',
              },
              moduleMetadata: { providers: [{ provide: 'foo', useValue: 42 }] },
            },
            forced: true,
            parameters: {} as any,
          });
        expect(countDestroy).toEqual(1);
      });
    });

    it('should properly destroy angular platform between each render', async () => {
      let countDestroy = 0;

      await rendererFactory
        .getRendererInstance('root', global.document.getElementById('root'))
        .render({
          storyFnAngular: {
            template: '🦊',
            props: {},
          },
          forced: false,
          parameters: {} as any,
        });

      getPlatform().onDestroy(() => {
        countDestroy += 1;
      });

      await rendererFactory
        .getRendererInstance('root', global.document.getElementById('root'))
        .render({
          storyFnAngular: {
            template: '🐻',
            props: {},
          },
          forced: false,
          parameters: {} as any,
        });

      expect(countDestroy).toEqual(1);
    });
  });

  describe('DocsRenderer', () => {
    it('should get DocsRenderer instance', () => {
      expect(
        rendererFactory.getRendererInstance(
          'story-in-docs',
          global.document.getElementById('story-in-docs')
        )
      ).toBeInstanceOf(DocsRenderer);
    });
  });
});
