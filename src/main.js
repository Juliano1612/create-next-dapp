#!/usr/bin/env node

import chalk from "chalk";
import { execSync } from "child_process";
import { Command } from "commander";
import cpy from "cpy";
import { execa } from "execa";
import fs from "fs-extra";
import { createRequire } from "module";
import path from "path";
import prompts from "prompts";
import { fileURLToPath } from "url";
import validateNpmPackageName from "validate-npm-package-name";
import delegationFeature from "./delegation.js";
import web3modalProvider from "./web3modal.js";
import os from "os";
import Handlebars from "handlebars";
import ssxMetricsServer from "./ssx-metrics-server.js";

const detectPackageManager = () => {
  try {
    const userAgent = process.env.npm_config_user_agent;

    if (userAgent) {
      if (userAgent.startsWith("pnpm")) {
        return "pnpm";
      }
      if (userAgent.startsWith("yarn")) {
        return "yarn";
      }
      if (userAgent.startsWith("npm")) {
        return "npm";
      }
    }
    try {
      execSync("pnpm --version", { stdio: "ignore" });
      return "pnpm";
    } catch {
      execSync("yarn --version", { stdio: "ignore" });
      return "yarn";
    }
  } catch {
    return "npm";
  }
};

const onCancel = () => {
  throw new Error(
    [
      chalk.red(
        "👀 Aborting creation..."
      )
    ].join(os.EOL)
  );
};

const generateEnv = (targetPath, env) => {
  const envContent = Object.keys(env).map(key => `${key}=${env[key]}`).join(os.EOL);

  fs.writeFileSync(path.join(targetPath, ".env"), envContent, function (err) {
    if (err) return console.log(err);
  });
};

const getProviderConfig = (env) => {
  if (env.NEXT_PUBLIC_SSX_INFURA_ID) {
    return [
      "",
      "\tprovider: {",
      "\t\ttype: ProviderType.Web3Modal,",
      "\t\tconfig: {",
      "\t\t\tproviderOptions: {",
      "\t\t\t\twalletconnect: {",
      "\t\t\t\t\tpackage: WalletConnectProvider,",
      "\t\t\t\t\toptions: {",
      "\t\t\t\t\t\tinfuraId: process.env.NEXT_PUBLIC_SSX_INFURA_ID,",
      "\t\t\t\t\t},",
      "\t\t\t\t},",
      "\t\t\t},",
      "\t\t}",
      "\t},"
    ].join(os.EOL);
  } else {
    return [
      "",
      "\tprovider: {",
      "\t\ttype: ProviderType.Web3Modal,",
      "\t},"
    ].join(os.EOL);
  }
};

const getProviderImport = (env) => {
  if (env.NEXT_PUBLIC_SSX_INFURA_ID) {
    return `import WalletConnectProvider from "@walletconnect/web3-provider";${os.EOL}import { ProviderType } from "@spruceid/ssx";${os.EOL}`;
  } else {
    return `import { ProviderType } from "@spruceid/ssx";${os.EOL}`;
  }
};

const generateSSXConfig = (templatesPath, targetPath, provider, env) => {
  const source = fs.readFileSync(path.join(templatesPath, 'ssx.config.hbs')).toString();
  const template = Handlebars.compile(source);
  const content = template({
    importProvider: provider === "MetaMask" ?
      "" :
      getProviderImport(env),
    provider: provider === "MetaMask" ?
      "" :
      getProviderConfig(env),
    server: env.NEXT_PUBLIC_SSX_METRICS_SERVER ?
      `${os.EOL}\tserver: process.env.NEXT_PUBLIC_SSX_METRICS_SERVER,`
      : "",
    delegationLookup: env.NEXT_PUBLIC_SSX_DELEGATION_LOOKUP ?
      `${os.EOL}\tdelegationLookup: !!(process.env.NEXT_PUBLIC_SSX_DELEGATION_LOOKUP === "true"),` :
      "",
    storage: env.NEXT_PUBLIC_SSX_STORAGE_TYPE ?
      `${os.EOL}\tstorage: process.env.NEXT_PUBLIC_SSX_STORAGE_TYPE,` :
      "",
  });

  fs.writeFileSync(path.join(targetPath, "ssx.config.js"), content, function (err) {
    if (err) return console.log(err);
  });

};

const { log } = console;

async function run() {
  try {
    let projectPath = "";
    let projectTemplate = "";

    const packageJson = createRequire(import.meta.url)("../package.json");

    const program = new Command(packageJson.name)
      .version(packageJson.version)
      .arguments("[project-directory]")
      .usage(`${chalk.green("[project-directory]")} [options]`)
      .action((name) => {
        projectPath = name;
      })
      .option("--typescript", "Explicitly tell the CLI to use TypeScript")
      .option(
        "--use-npm",
        "Explicitly tell the CLI to bootstrap the app using npm"
      )
      .option(
        "--use-yarn",
        "Explicitly tell the CLI to bootstrap the app using Yarn"
      )
      .option(
        "--use-pnpm",
        "Explicitly tell the CLI to bootstrap the app using pnpm"
      )
      .allowUnknownOption()
      .parse(process.argv);

    const options = program.opts();

    const reservedPackageNames = [
      "ssx",
      "@spruceid/ssx",
      "wagmi",
      "ethers",
      "next",
      "react",
      "react-dom",
    ];

    log();

    const isValidProjectName = (value) =>
      validateNpmPackageName(value).validForNewPackages;

    const invalidProjectNameErrorMessage =
      "Project name must be a valid npm package name.";

    if (typeof projectPath === "string") {
      projectPath = projectPath.trim();
    }

    if (!projectPath) {
      log();
      const { path } = await prompts({
        initial: "my-ssx-next-dapp",
        message: "What is the name of your project?",
        name: "path",
        type: "text",
      });
      projectPath = path;
    }

    let env = {};

    const { provider } = await prompts([
      {
        type: "select",
        name: "provider",
        message: "Which will be your default provider?",
        choices: [
          { title: "MetaMask", value: "MetaMask" },
          { title: "Web3Modal", value: web3modalProvider }
        ]
      }
    ],
      { onCancel }
    );

    if (provider.run) await provider.run(env, onCancel);

    const { features } = await prompts([
      {
        type: "multiselect",
        name: "features",
        message: "Which features would you like to enable?",
        choices: [
          { title: "Delegation History", value: delegationFeature },
          // TODO(w4ll3): figure out typing
          // { title: "Storage", value: storageFeature },
        ],
      },
    ],
      { onCancel }
    );

    features.forEach(async (feature) => {
      await feature.run(env, onCancel);
    });

    await ssxMetricsServer.run(env, onCancel);

    projectTemplate = "typescript";

    log();

    if (!isValidProjectName(projectPath)) {
      throw new Error(
        [
          chalk.red(
            "👀 The project name you provided is not a valid package name."
          ),
          `🙏 ${invalidProjectNameErrorMessage}`,
        ].join(os.EOL)
      );
    }

    if (reservedPackageNames.includes(projectPath)) {
      throw new Error(
        [
          chalk.red(
            "👀 The project name you provided is a reserved package name."
          ),
          `🙏 Please use a project name other than "${reservedPackageNames.find(
            (x) => x === projectPath
          )}".`,
        ].join(os.EOL)
      );
    }

    const targetPath = path.join(process.cwd(), projectPath);

    if (fs.existsSync(targetPath)) {
      throw new Error(
        [
          chalk.red(`👀 The target directory "${projectPath}" already exists.`),
          "🙏 Please remove this directory or choose a different project name.",
        ].join(os.EOL)
      );
    }

    const dirname = fileURLToPath(new URL(".", import.meta.url));
    const templatesPath = path.join(dirname, "..", "templates");
    const selectedTemplatePath = path.join(templatesPath, projectTemplate);

    log(chalk.cyan(`🚀 Creating a new SSX dApp in ${chalk.bold(targetPath)}`));

    const ignoreList = ["node_modules", "CHANGELOG.md"];

    await cpy(path.join(selectedTemplatePath, "**", "*"), targetPath, {
      filter: (src) =>
        ignoreList.every((ignore) => {
          const relativePath = path.relative(selectedTemplatePath, src.path);
          return !relativePath.includes(ignore);
        }),
      rename: (name) => name.replace(/^_dot_/, "."),
    });

    generateEnv(targetPath, env);

    generateSSXConfig(templatesPath, targetPath, provider, env);


    // Update package name
    const pkgJson = await fs.readJson(path.join(targetPath, "package.json"));
    pkgJson.name = projectPath;
    pkgJson.version = "0.0.1";

    await fs.writeFile(
      path.join(targetPath, "package.json"),
      JSON.stringify(pkgJson, null, 2)
    );

    let packageManager;

    if (options.usePnpm) {
      packageManager = "pnpm";
    }

    if (options.useYarn) {
      packageManager = "yarn";
    }

    if (options.useNpm) {
      packageManager = "yarn";
    }

    if (!packageManager) {
      packageManager = detectPackageManager();
    }

    log(
      chalk.cyan(
        `📦 Installing dependencies with ${chalk.bold(
          packageManager
        )}. This could take a while.`
      )
    );

    await execa(packageManager, ["install"], {
      cwd: targetPath,
      stdio: "inherit",
    });

    await execa(
      packageManager,
      [
        packageManager === 'yarn' ? 'add' : 'install',
        '@spruceid/ssx',
      ],
      {
        cwd: targetPath,
        stdio: 'inherit',
      },
    );

    log(chalk.green("Project created. Happy coding."));
    log();
    log(
      chalk.cyan(
        `👉 To get started, run ${chalk.bold(
          `cd ${projectPath}`
        )} and then ${chalk.bold(
          `${packageManager}${packageManager === "npm" ? " run" : ""} start`
        )}`
      )
    );
    log();
  } catch (err) {
    log(chalk.red(err.message));
    process.exit(1);
  }
}

run();
