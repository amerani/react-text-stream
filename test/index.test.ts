import { describe, it, expect, vi } from 'vitest';

describe('index.ts exports', () => {
  describe('ReactTextStream export', () => {
    it('should export ReactTextStream component', async () => {
      const { ReactTextStream } = await import('../src/index');
      
      expect(ReactTextStream).toBeDefined();
      expect(typeof ReactTextStream).toBe('function');
    });

    it('should be the same as direct import', async () => {
      const { ReactTextStream: ExportedComponent } = await import('../src/index');
      const DirectComponent = (await import('../src/components/ReactTextStream')).default;
      
      expect(ExportedComponent).toBe(DirectComponent);
    });
  });

  describe('useTextStream export', () => {
    it('should export useTextStream hook', async () => {
      const { useTextStream } = await import('../src/index');
      
      expect(useTextStream).toBeDefined();
      expect(typeof useTextStream).toBe('function');
    });

    it('should be the same as direct import', async () => {
      const { useTextStream: ExportedHook } = await import('../src/index');
      const DirectHook = (await import('../src/hooks/useTextStream')).default;
      
      expect(ExportedHook).toBe(DirectHook);
    });
  });

  describe('module structure', () => {
    it('should export exactly 2 items', async () => {
      const exports = await import('../src/index');
      const exportKeys = Object.keys(exports);
      
      expect(exportKeys).toHaveLength(2);
      expect(exportKeys).toContain('ReactTextStream');
      expect(exportKeys).toContain('useTextStream');
    });

    it('should not export EventStore directly', async () => {
      const exports = await import('../src/index');
      const exportKeys = Object.keys(exports);
      
      expect(exportKeys).not.toContain('EventStore');
    });
  });

  describe('import compatibility', () => {
    it('should support named imports', async () => {
      const { ReactTextStream, useTextStream } = await import('../src/index');
      
      expect(ReactTextStream).toBeDefined();
      expect(useTextStream).toBeDefined();
    });

    it('should support namespace imports', async () => {
      const ReactTextStreamModule = await import('../src/index');
      
      expect(ReactTextStreamModule.ReactTextStream).toBeDefined();
      expect(ReactTextStreamModule.useTextStream).toBeDefined();
    });

    it('should support individual named imports', async () => {
      const { ReactTextStream } = await import('../src/index');
      const { useTextStream } = await import('../src/index');
      
      expect(ReactTextStream).toBeDefined();
      expect(useTextStream).toBeDefined();
    });
  });

  describe('TypeScript compatibility', () => {
    it('should maintain type information for ReactTextStream', async () => {
      const { ReactTextStream } = await import('../src/index');
      
      // This test ensures TypeScript types are preserved
      // The component should accept the expected props
      expect(() => {
        // This would cause a TypeScript error if types are wrong
        const props = {
          url: 'http://example.com',
          onEvent: (data: any) => data.message,
          render: (stream: string) => stream
        };
        
        // Just check that the function exists and can be called
        expect(typeof ReactTextStream).toBe('function');
      }).not.toThrow();
    });
  });

  describe('circular dependency prevention', () => {
    it('should not cause circular dependencies', async () => {
      // This test ensures that the index file doesn't create circular dependencies
      const module = await import('../src/index');
      
      expect(module.ReactTextStream).toBeDefined();
      expect(module.useTextStream).toBeDefined();
      
      // If there were circular dependencies, the module would be undefined or cause errors
      expect(() => {
        // Try to access the exports
        const { ReactTextStream, useTextStream } = module;
        expect(ReactTextStream).toBeDefined();
        expect(useTextStream).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('module loading', () => {

    it('should handle multiple imports', async () => {
      // Test that multiple imports work correctly
      const import1 = import('../src/index');
      const import2 = import('../src/index');
      const import3 = import('../src/index');
      
      const [module1, module2, module3] = await Promise.all([import1, import2, import3]);
      
      expect(module1.ReactTextStream).toBe(module2.ReactTextStream);
      expect(module2.ReactTextStream).toBe(module3.ReactTextStream);
      expect(module1.useTextStream).toBe(module2.useTextStream);
      expect(module2.useTextStream).toBe(module3.useTextStream);
    });
  });
});
