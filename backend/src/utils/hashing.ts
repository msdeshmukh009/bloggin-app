const hashPassword = async (password: string) => {
  const encodedPassword = new TextEncoder().encode(password);

  const myDigest = await crypto.subtle.digest(
    {
      name: "SHA-256",
    },
    encodedPassword
  );

  const hexString = [...new Uint8Array(myDigest)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return hexString;
};

export default hashPassword;
