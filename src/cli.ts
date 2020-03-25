import meow from "meow";
import { search } from "./sql-string-search";

export const cli = meow(
    `
    Usage
      $ sql-string-search [glob*]
 
    Examples
      $ sql-string-search "**/*"
`,
    {
        flags: {},
        autoHelp: true,
        autoVersion: true
    }
);

export const run = async (_input = cli.input, _flags = cli.flags) => {
    return search(_input).then(results => {
        const output = results.map(result => `${result.filePath}:${result.range[0]}-${result.range[1]}
${result.content}
        `).join("\n");
        return {
            exitStatus: 0,
            stdout: output,
            stderr: null
        };
    });
};
