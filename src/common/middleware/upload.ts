import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const uploadDirectory = path.join(process.cwd(), "src/uploads/avatars");

// Ensure directory exists
if (!fs.existsSync(uploadDirectory)) { 
	fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDirectory);
	},
	filename: (_req, file, cb) => {
		const uniqueSuffix = uuidv4();
		const ext = path.extname(file.originalname);
		cb(null, `avatar-${uniqueSuffix}${ext}`);
	},
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error("Only images are allowed (jpeg, jpg, png, gif, webp)") as any, false);
	}
};

export const uploadAvatar = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
});
