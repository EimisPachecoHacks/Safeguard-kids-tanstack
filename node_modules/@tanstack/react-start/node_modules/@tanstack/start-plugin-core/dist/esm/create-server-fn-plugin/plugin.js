import { TRANSFORM_ID_REGEX } from "../constants.js";
import { ServerFnCompiler } from "./compiler.js";
function cleanId(id) {
  return id.split("?")[0];
}
const LookupKindsPerEnv = {
  client: /* @__PURE__ */ new Set(["Middleware", "ServerFn"]),
  server: /* @__PURE__ */ new Set(["ServerFn"])
};
const getLookupConfigurationsForEnv = (env, framework) => {
  const createServerFnConfig = {
    libName: `@tanstack/${framework}-start`,
    rootExport: "createServerFn"
  };
  if (env === "client") {
    return [
      {
        libName: `@tanstack/${framework}-start`,
        rootExport: "createMiddleware"
      },
      {
        libName: `@tanstack/${framework}-start`,
        rootExport: "createStart"
      },
      createServerFnConfig
    ];
  } else {
    return [createServerFnConfig];
  }
};
const SERVER_FN_LOOKUP = "server-fn-module-lookup";
function createServerFnPlugin(opts) {
  const compilers = {};
  function perEnvServerFnPlugin(environment) {
    const transformCodeFilter = environment.type === "client" ? [/\.\s*handler\(/, /\.\s*createMiddleware\(\)/] : [/\.\s*handler\(/];
    return {
      name: `tanstack-start-core::server-fn:${environment.name}`,
      enforce: "pre",
      applyToEnvironment(env) {
        return env.name === environment.name;
      },
      transform: {
        filter: {
          id: {
            exclude: new RegExp(`${SERVER_FN_LOOKUP}$`),
            include: TRANSFORM_ID_REGEX
          },
          code: {
            include: transformCodeFilter
          }
        },
        async handler(code, id) {
          let compiler = compilers[this.environment.name];
          if (!compiler) {
            compiler = new ServerFnCompiler({
              env: environment.type,
              directive: opts.directive,
              lookupKinds: LookupKindsPerEnv[environment.type],
              lookupConfigurations: getLookupConfigurationsForEnv(
                environment.type,
                opts.framework
              ),
              loadModule: async (id2) => {
                if (this.environment.mode === "build") {
                  const loaded = await this.load({ id: id2 });
                  if (!loaded.code) {
                    throw new Error(`could not load module ${id2}`);
                  }
                  compiler.ingestModule({ code: loaded.code, id: id2 });
                } else if (this.environment.mode === "dev") {
                  await this.environment.fetchModule(
                    id2 + "?" + SERVER_FN_LOOKUP
                  );
                } else {
                  throw new Error(
                    `could not load module ${id2}: unknown environment mode ${this.environment.mode}`
                  );
                }
              },
              resolveId: async (source, importer) => {
                const r = await this.resolve(source, importer);
                if (r) {
                  if (!r.external) {
                    return cleanId(r.id);
                  }
                }
                return null;
              }
            });
            compilers[this.environment.name] = compiler;
          }
          id = cleanId(id);
          const result = await compiler.compile({ id, code });
          return result;
        }
      },
      hotUpdate(ctx) {
        const compiler = compilers[this.environment.name];
        ctx.modules.forEach((m) => {
          if (m.id) {
            const deleted = compiler?.invalidateModule(m.id);
            if (deleted) {
              m.importers.forEach((importer) => {
                if (importer.id) {
                  compiler?.invalidateModule(importer.id);
                }
              });
            }
          }
        });
      }
    };
  }
  return [
    ...opts.environments.map(perEnvServerFnPlugin),
    {
      name: "tanstack-start-core:capture-server-fn-module-lookup",
      // we only need this plugin in dev mode
      apply: "serve",
      applyToEnvironment(env) {
        return !!opts.environments.find((e) => e.name === env.name);
      },
      transform: {
        filter: {
          id: new RegExp(`${SERVER_FN_LOOKUP}$`)
        },
        handler(code, id) {
          const compiler = compilers[this.environment.name];
          compiler?.ingestModule({ code, id: cleanId(id) });
        }
      }
    }
  ];
}
export {
  createServerFnPlugin
};
//# sourceMappingURL=plugin.js.map
