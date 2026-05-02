export const uploadAdminProductImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file received" });
  }

  const port = process.env.PORT || 5000;
  const publicBase =
    process.env.SERVER_PUBLIC_URL?.replace(/\/$/, "") || `http://localhost:${port}`;

  const url = `${publicBase}/uploads/${req.file.filename}`;
  return res.status(201).json({ url });
};
