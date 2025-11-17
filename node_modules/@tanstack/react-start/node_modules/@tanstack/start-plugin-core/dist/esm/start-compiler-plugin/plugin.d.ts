import { PluginOption } from 'vite';
import { CompileStartFrameworkOptions } from './compilers.js';
export type TanStackStartViteOptions = {
    globalMiddlewareEntry: string;
};
export declare function startCompilerPlugin(opts: {
    framework: CompileStartFrameworkOptions;
    environments: Array<{
        name: string;
        type: 'client' | 'server';
    }>;
}): PluginOption;
