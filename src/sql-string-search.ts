import fs from "fs";
import ESTree from "estree";
import { walk } from "estree-walker";
import globby from "globby";

const Acorn = require("acorn");
const debug = require("debug")("sql-string-search");
export const search = async (globs: string[]) => {
    const files = await globby(globs, {
        gitignore: true,
        ignore: ["**/node_modules/**"],
    });
    const results: { filePath: string; range: [number, number]; content: string }[] = [];
    files.forEach((filePath) => {
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const nodes = grep(content);
            nodes.forEach((node) => {
                const range = node.range as [number, number];
                results.push({
                    filePath: filePath,
                    range: range,
                    content: content.slice(range[0], range[1]),
                });
            });
        } catch (error) {
            debug("Parsing at", filePath, "Error", error);
        }
    });
    return results;
};

const hasSQLLikeString = (node: ESTree.TemplateLiteral) => {
    const boundaryLine = 2;
    let count = 0;
    node.quasis.forEach((queasi) => {
        const patterns = /SELECT|WHERE|FROM/g;
        if (patterns.test(queasi.value.raw)) {
            count++;
        }
    });
    return count > boundaryLine;
};
export const grep = (code: string) => {
    const AST = Acorn.parse(code, {
        ranges: true,
        sourceType: "module",
    });
    const resultNodes: ESTree.TemplateLiteral[] = [];
    walk(AST, {
        enter(node) {
            if (node.type !== "TemplateLiteral") {
                return;
            }
            const templateLiteral = node as ESTree.TemplateLiteral;
            if (hasSQLLikeString(templateLiteral)) {
                resultNodes.push(templateLiteral);
            }
        },
    });
    return resultNodes;
};
