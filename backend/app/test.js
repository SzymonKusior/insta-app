const uploadedFile = files.file;

if (uploadedFile) {
    const oldPath = uploadedFile.filepath;
    console.log(oldPath);
    const extension = path.extname(uploadedFile.originalFilename || "");
    const newFilename = path.basename(oldPath) + extension;
    const newPath = path.join(__dirname, 'upload', newFilename);

    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            console.error("Rename failed:", err);
            return res.writeHead(500).end("Error saving file");
        }

       
    });