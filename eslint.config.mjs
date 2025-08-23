import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default defineConfig([
	globalIgnores(["out"]),
	{
		files: ["**/*.js", "eslint.config.mjs"],
		extends: compat.extends("eslint:recommended", "plugin:prettier/recommended"),
		rules: {
			"prettier/prettier": "warn",
		},
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		extends: compat.extends(
			"eslint:recommended",
			"plugin:prettier/recommended",
			"plugin:@typescript-eslint/recommended-type-checked",
			"plugin:roblox-ts/recommended-legacy",
		),
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		rules: {
			"prettier/prettier": "warn",
		},
	},
]);
