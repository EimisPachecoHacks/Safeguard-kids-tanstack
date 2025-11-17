import { CompileStartFrameworkOptions } from '../start-compiler-plugin/compilers.js';
import { PluginOption } from 'vite';
export declare function createServerFnPlugin(opts: {
    framework: CompileStartFrameworkOptions;
    directive: string;
    environments: Array<{
        name: string;
        type: 'client' | 'server';
    }>;
}): PluginOption;
