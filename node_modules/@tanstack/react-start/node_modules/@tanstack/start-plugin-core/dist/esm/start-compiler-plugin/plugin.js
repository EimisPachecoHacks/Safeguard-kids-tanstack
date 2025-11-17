import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { logDiff } from "@tanstack/router-utils";
import { VIRTUAL_MODULES } from "@tanstack/start-server-core";
import { normalizePath } from "vite";
import path from "pathe";
import { makeIdFiltersToMatchWithQuery } from "@rolldown/pluginutils";
import { TRANSFORM_ID_REGEX } from "../constants.js";
import { compileStartOutputFactory } from "./compilers.js";
import { transformFuncs } from "./constants.js";
const debug = process.env.TSR_VITE_DEBUG && ["true", "start-plugin"].includes(process.env.TSR_VITE_DEBUG);
const tokenRegex = new RegExp(transformFuncs.join("|"));
const require2 = createRequire(import.meta.url);
function resolveRuntimeFiles(opts) {
  const pkgRoot = resolvePackage(opts.package);
  const basePath = path.join(pkgRoot, "dist", "esm");
  return opts.files.map((file) => normalizePath(path.join(basePath, file)));
}
function resolvePackage(packageName) {
  const pkgRoot = path.dirname(require2.resolve(packageName + "/package.json"));
  return pkgRoot;
}
const transformFilter = {
  code: tokenRegex,
  id: {
    include: TRANSFORM_ID_REGEX,
    exclude: [
      VIRTUAL_MODULES.serverFnManifest,
      // N.B. the following files either just re-export or provide the runtime implementation of those functions
      // we do not want to include them in the transformation
      // however, those packages (especially start-client-core ATM) also USE these functions
      // (namely `createIsomorphicFn` in `packages/start-client-core/src/getRouterInstance.ts`) and thus need to be transformed
      ...makeIdFiltersToMatchWithQuery([
        ...resolveRuntimeFiles({
          package: "@tanstack/start-client-core",
          files: [
            "index.js",
            "createIsomorphicFn.js",
            "envOnly.js",
            "serverFnFetcher.js",
            "createStart.js",
            "createMiddleware.js"
          ]
        }),
        ...resolveRuntimeFiles({
          package: "@tanstack/start-server-core",
          files: ["index.js", "server-functions-handler.js"]
        })
      ])
    ]
  }
};
function startCompilerPlugin(opts) {
  const compileStartOutput = compileStartOutputFactory(opts.framework);
  function perEnvCompilerPlugin(environment) {
    return {
      name: `tanstack-start-core:compiler:${environment.name}`,
      enforce: "pre",
      applyToEnvironment(env) {
        return env.name === environment.name;
      },
      transform: {
        filter: transformFilter,
        handler(code, id) {
          const url = pathToFileURL(id);
          url.searchParams.delete("v");
          id = fileURLToPath(url).replace(/\\/g, "/");
          if (debug) console.info(`${environment.name} Compiling Start: `, id);
          const compiled = compileStartOutput({
            code,
            filename: id,
            env: environment.type
          });
          if (debug) {
            logDiff(code, compiled.code);
            console.log("Output:\n", compiled.code + "\n\n");
          }
          return compiled;
        }
      }
    };
  }
  return opts.environments.map(perEnvCompilerPlugin);
}
export {
  startCompilerPlugin
};
//# sourceMappingURL=plugin.js.map
