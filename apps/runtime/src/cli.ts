import { parseArgs } from 'node:util';
import { mcpCommand } from './commands/mcp.ts';
import { migrateCommand } from './commands/migrate.ts';
import { serveCommand } from './commands/serve.ts';
import { statusCommand } from './commands/status.ts';
import { stopCommand } from './commands/stop.ts';
import { versionCommand } from './commands/version.ts';

const USAGE = `prismhub <command> [options]

Commands:
  serve       Start the Prismhub HTTP server
  stop        Stop the running Prismhub server
  status      Print status of the running Prismhub server (JSON)
  mcp         Run Prismhub as an MCP server over stdio
  migrate     Run database migrations
  version     Print version and exit
  help        Show this help

Run 'prismhub help <command>' for command-specific help.
`;

type CommandFn = () => Promise<number> | number;

const COMMANDS: Readonly<Record<string, CommandFn>> = {
  serve: serveCommand,
  stop: stopCommand,
  status: statusCommand,
  mcp: mcpCommand,
  migrate: migrateCommand,
  version: versionCommand,
  '--version': versionCommand,
  '-v': versionCommand,
};

export async function runCli(argv: readonly string[]): Promise<number> {
  const { positionals, values } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    strict: false,
    options: {
      version: { type: 'boolean', short: 'v' },
    },
  });

  if (values.version) {
    return versionCommand();
  }

  const [command = 'help'] = positionals;

  if (command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(USAGE);
    return 0;
  }

  const fn = COMMANDS[command];
  if (!fn) {
    process.stderr.write(`Unknown command: ${command}\n\n${USAGE}`);
    return 2;
  }

  return await fn();
}
