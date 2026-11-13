import multer from "multer";

const imageLimit = 5 * 1024 * 1024;
const videoLimit = 50 * 1024 * 1024;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const boundedMemoryStorage = {
  _handleFile(req, file, callback) {
    const limit = file.mimetype.startsWith("image/") ? imageLimit : videoLimit;
    const chunks = [];
    let size = 0;
    let exceeded = false;
    let finished = false;

    file.stream.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        exceeded = true;
        chunks.length = 0;
        file.stream.resume();
        return;
      }

      if (!exceeded) chunks.push(chunk);
    });

    file.stream.once("error", (error) => {
      if (finished) return;
      finished = true;
      callback(error);
    });

    file.stream.once("end", () => {
      if (finished) return;
      finished = true;

      if (exceeded) {
        callback(new multer.MulterError("LIMIT_FILE_SIZE"));
        return;
      }

      callback(null, {
        buffer: Buffer.concat(chunks, size),
        size,
      });
    });
  },

  _removeFile(req, file, callback) {
    delete file.buffer;
    callback(null);
  },
};

const upload = multer({
  storage: boundedMemoryStorage,
  fileFilter(req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error(
        "Upload a JPEG, PNG, or WebP image, or an MP4, MOV, or WebM video."
      );
      error.code = "INVALID_STORY_MEDIA";
      callback(error);
      return;
    }

    callback(null, true);
  },
  limits: {
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 100,
  },
});

export const uploadStoryMedia = upload.single("media");

export const handleStoryUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Images must be 5 MB or smaller and videos must be 50 MB or smaller."
      : "Upload one media file using the 'media' field.";

    res.status(400).json({ success: false, message });
    return;
  }

  if (error.code === "INVALID_STORY_MEDIA") {
    res.status(400).json({ success: false, message: error.message });
    return;
  }

  next(error);
};
