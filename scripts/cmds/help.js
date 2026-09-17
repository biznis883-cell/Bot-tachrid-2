const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
	config: {
		name: "help",
		version: "2.0",
		author: "NTKhang / Modified",
		countDown: 5,
		role: 0,
		description: {
			en: "Show the list of available commands"
		},
		category: "info",
		guide: {
			en: "{pn} - Show commands\n{pn} <command> - Show command information"
		},
		priority: 1
	},

	langs: {
		en: {
			commandNotFound: "Command \"%1\" does not exist.",
			pageNotFound: "Page %1 does not exist."
		}
	},

	onStart: async function ({
		message,
		args,
		event,
		threadsData,
		getLang,
		role
	}) {
		const { threadID } = event;
		const prefix = getPrefix(threadID);

		const threadData = await threadsData.get(threadID);

		// =========================
		// COMMAND INFO
		// =========================
		const commandName = (args[0] || "").toLowerCase();

		let command =
			commands.get(commandName) ||
			commands.get(aliases.get(commandName));

		// Check group aliases
		const aliasesData = threadData.data.aliases || {};

		if (!command) {
			for (const cmdName in aliasesData) {
				if (
					Array.isArray(aliasesData[cmdName]) &&
					aliasesData[cmdName].includes(commandName)
				) {
					command = commands.get(cmdName);
					break;
				}
			}
		}

		// If a command was requested
		if (command && args[0]) {
			const config = command.config;

			let guide = config.guide?.en || "";

			if (typeof guide === "object")
				guide = guide.body || "";

			guide = String(guide)
				.replace(/\{prefix\}|\{p\}/g, prefix)
				.replace(/\{name\}|\{n\}/g, config.name)
				.replace(/\{pn\}/g, prefix + config.name);

			const description =
				typeof config.description === "string"
					? config.description
					: config.description?.en || "No description";

			const aliasesList = Array.isArray(config.aliases)
				? config.aliases.join(", ")
				: "None";

			const roleText =
				config.role == 0
					? "All users"
					: config.role == 1
						? "Group admins"
						: "Bot admin";

			const msg =
				`╔═════☆BOT☆═════╗\n` +
				`┃\n` +
				`┃  ${config.name}\n` +
				`┃  ${description}\n` +
				`┃  Role: ${roleText}\n` +
				`┃  Aliases: ${aliasesList}\n` +
				`┃\n` +
				`┃  Usage:\n` +
				`┃  ${guide.replace(/\n/g, "\n┃  ")}\n` +
				`┃\n` +
				`╚═══☆BASSET☆═════╝`;

			return message.reply({
				body: msg,
				mentions: []
			});
		}

		// =========================
		// COMMAND LIST
		// =========================

		const commandList = [];

		for (const [name, value] of commands) {
			if (!value?.config)
				continue;

			// Hide commands according to role
			if (value.config.role > 1 && role < value.config.role)
				continue;

			commandList.push({
				name,
				category: value.config.category || "Other",
				priority: value.priority || 0
			});
		}

		// Sort by category then name
		commandList.sort((a, b) => {
			if (a.category.toLowerCase() !== b.category.toLowerCase())
				return a.category.localeCompare(b.category);

			return a.name.localeCompare(b.name);
		});

		// =========================
		// BUILD MESSAGE
		// =========================

		let msg = `╔═════☆BOT☆═════╗\n`;

		let currentCategory = "";

		for (const cmd of commandList) {
			const category = cmd.category.toUpperCase();

			if (category !== currentCategory) {
				currentCategory = category;

				msg += `\n┃ ☆ ${category} ☆\n`;
			}

			msg += `┃ • ${cmd.name}\n`;
		}

		msg +=
			`\n╚═══☆BASSET☆═════╝\n` +
			`Type ${prefix}help <cmd> for info`;

		return message.reply({
			body: msg
		});
	}
};
