import nodemailer from "nodemailer";

import { env } from "../utils/envConfig";

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: env.EMAIL_USER,
		pass: env.EMAIL_PASS,
	},
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string): Promise<void> => {
	try {
		await transporter.sendMail({
			from: `"Honk's Task Manager" <${env.EMAIL_USER}>`,
			to,
			subject,
			text,
			html,
		});
	} catch (error) {
		throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
};
