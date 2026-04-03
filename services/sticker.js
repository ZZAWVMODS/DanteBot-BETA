const path = require("node:path");
const fs = require("node:fs");
const webp = require("node-webpmux");
const { exec } = require("child_process");

async function addStickerMetadata(media, metadata) {
  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const tmpFileIn = path.join(tmpDir, `in_${Date.now()}.webp`);
  const tmpFileOut = path.join(tmpDir, `out_${Date.now()}.webp`);

  await fs.promises.writeFile(tmpFileIn, media);
  const img = new webp.Image();

  const json = {
    "sticker-pack-id": `DanteBot-${Date.now()}`,
    "sticker-pack-name": metadata.username,
    "sticker-pack-publisher": metadata.botName,
    emojis: ["🇦🇱"],
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);

  const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
  const exif = Buffer.concat([exifAttr, jsonBuff]);
  exif.writeUIntLE(jsonBuff.length, 14, 4);

  try {
    await img.load(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);
    return tmpFileOut;
  } finally {
    if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);
  }
}

exports.processStaticSticker = async (inputPath, metadata) => {
  return new Promise((resolve, reject) => {
    const tempOutputPath = path.join(__dirname, `../tmp/static_${Date.now()}.webp`);
    
   
    const cmd = `ffmpeg -i "${inputPath}" -vf "scale=512:512" -f webp -quality 100 "${tempOutputPath}"`;

    exec(cmd, async (error) => {
      if (error) return reject(error);
      try {
        const processedBuffer = await fs.promises.readFile(tempOutputPath);
        const finalPath = await addStickerMetadata(processedBuffer, metadata);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        resolve(finalPath);
      } catch (e) { reject(e); }
    });
  });
};

exports.processAnimatedSticker = async (inputPath, metadata) => {
  return new Promise((resolve, reject) => {
    const tempOutputPath = path.join(__dirname, `../tmp/anim_${Date.now()}.webp`);
    
  
    const cmd = `ffmpeg -i "${inputPath}" -t 7 -vf "scale=512:512,fps=15" -c:v libwebp -lossless 0 -quality 75 -compression_level 6 -loop 0 -an -f webp "${tempOutputPath}"`;

    exec(cmd, async (error) => {
      if (error) return reject(error);
      try {
        const processedBuffer = await fs.promises.readFile(tempOutputPath);
        const finalPath = await addStickerMetadata(processedBuffer, metadata);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        resolve(finalPath);
      } catch (e) { reject(e); }
    });
  });
};
