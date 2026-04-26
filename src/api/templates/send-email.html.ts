export const buildOtpEmailHtml = (otp_code: string, otp_type: string, name: string) => {
	return `
    <div
        style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">
          ${
						otp_type === "register"
							? "Welcome to Honk's Learning Hub"
							: otp_type === "reset_password"
								? "Reset Your Password"
								: otp_type === "change_email"
									? "Change Your Email Address"
									: "Notification"
					}
        </h2>
        <p style="font-size: 16px;">Hello, <span style="color: #ff5757; font-weight: bold;">${name}</span>
        </p>
        <p style="font-size: 16px;">Your OTP code is:</p>
        <div
            style="font-size: 28px; font-weight: bold; color: #333; background-color: #f2f2f2; padding: 15px; text-align: center; border-radius: 8px;">
            ${otp_code}
        </div>
        <p style="margin-top: 20px; font-size: 14px;">This code is valid for <strong>5 minutes</strong>. If you didn’t
            request this, please ignore this email.</p>
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} Honk's Learning
            Hub. All rights reserved.</p>
    </div>
  `;
};
